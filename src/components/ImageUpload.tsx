import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Props = {
  value: string | null | undefined
  onChange: (url: string | null) => void
  schoolId: string
  folder: string
}

export function ImageUpload({ value, onChange, schoolId, folder }: Props) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed')
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${schoolId}/${folder}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('school-images')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('school-images').getPublicUrl(path)
      onChange(data.publicUrl)
      toast.success('Image uploaded')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      toast.error(msg)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-24 rounded-md object-cover border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="mr-2 h-4 w-4" /> {busy ? 'Uploading…' : 'Upload image'}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFiles(f)
        }}
      />
    </div>
  )
}
