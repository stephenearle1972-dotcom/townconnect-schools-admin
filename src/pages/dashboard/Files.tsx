import { useState, useRef, DragEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, Copy, FileIcon, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useSchool } from '@/lib/school'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type FileRow = Database['public']['Tables']['files']['Row']

const CATEGORIES = ['newsletters', 'term-calendars', 'fee-schedules', 'forms', 'other']

const fmtBytes = (b: number | null) => {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilesPage() {
  const { activeSchool } = useSchool()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [category, setCategory] = useState<string>('newsletters')
  const [confirmDelete, setConfirmDelete] = useState<FileRow | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const { data: files = [], isLoading } = useQuery<FileRow[]>({
    queryKey: ['files', activeSchool?.id],
    enabled: !!activeSchool,
    queryFn: async () => {
      if (!activeSchool) return []
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('school_id', activeSchool.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const upload = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: string }) => {
      if (!activeSchool) throw new Error('No active school')
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be 10MB or smaller')
      const isImage = file.type.startsWith('image/')
      const bucket = isImage ? 'school-images' : 'school-files'
      const id = crypto.randomUUID()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
      const path = `${activeSchool.id}/${category}/${id}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('files').insert({
        school_id: activeSchool.id,
        category,
        filename: file.name,
        storage_path: `${bucket}/${path}`,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user?.id ?? null,
      })
      if (dbErr) throw dbErr
    },
    onSuccess: () => {
      toast.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['files', activeSchool?.id] })
      setPendingFile(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const remove = useMutation({
    mutationFn: async (file: FileRow) => {
      const [bucket, ...rest] = file.storage_path.split('/')
      const path = rest.join('/')
      await supabase.storage.from(bucket).remove([path])
      const { error } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', file.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('File deleted')
      queryClient.invalidateQueries({ queryKey: ['files', activeSchool?.id] })
      setConfirmDelete(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setPendingFile(f)
  }

  const grouped = files.reduce<Record<string, FileRow[]>>((acc, f) => {
    const key = f.category ?? 'other'
    acc[key] = acc[key] ?? []
    acc[key].push(f)
    return acc
  }, {})

  const publicUrl = (file: FileRow) => {
    const [bucket, ...rest] = file.storage_path.split('/')
    if (bucket === 'school-images') {
      return supabase.storage.from(bucket).getPublicUrl(rest.join('/')).data.publicUrl
    }
    return null
  }

  const copyLink = async (file: FileRow) => {
    const url = publicUrl(file)
    if (url) {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } else {
      const [bucket, ...rest] = file.storage_path.split('/')
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(rest.join('/'), 60 * 60 * 24 * 7)
      if (error) {
        toast.error(error.message)
        return
      }
      await navigator.clipboard.writeText(data.signedUrl)
      toast.success('Signed link copied (valid 7 days)')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">Files</h1>

      <Card>
        <CardContent
          className={`p-8 border-2 border-dashed text-center transition-colors ${
            dragOver ? 'border-navy bg-navy/5' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Drag and drop a file here, or</p>
          <Button variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setPendingFile(f)
              if (inputRef.current) inputRef.current.value = ''
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">Up to 10MB per file</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No files uploaded yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="text-lg font-semibold text-navy mb-3 capitalize">{cat.replace(/-/g, ' ')}</h2>
              <Card>
                <div className="divide-y">
                  {list.map((f) => {
                    const isImage = f.mime_type?.startsWith('image/')
                    const url = isImage ? publicUrl(f) : null
                    return (
                      <div key={f.id} className="flex items-center gap-4 p-4">
                        {isImage && url ? (
                          <img src={url} alt="" className="h-12 w-12 rounded object-cover border" />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center rounded border bg-muted">
                            {isImage ? (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <FileIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{f.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtBytes(f.size_bytes)} · {format(new Date(f.created_at), 'd MMM yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{f.mime_type ?? 'file'}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => copyLink(f)}>
                            <Copy className="mr-1 h-3 w-3" /> Copy bot link
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(f)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose category</DialogTitle>
            <DialogDescription>{pendingFile?.name}</DialogDescription>
          </DialogHeader>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)} disabled={upload.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => pendingFile && upload.mutate({ file: pendingFile, category })}
              disabled={upload.isPending}
              className="bg-navy hover:bg-navy/90"
            >
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.filename} will be removed and parents will no longer be able to access it via the bot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
