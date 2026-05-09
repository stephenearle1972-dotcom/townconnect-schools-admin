import { ReactNode, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase
import { useSchool } from '@/lib/school'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
import { Skeleton } from '@/components/ui/skeleton'

export type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export type CrudTable =
  | 'teachers'
  | 'sport_fixtures'
  | 'calendar_events'
  | 'notices'
  | 'fees'
  | 'bus_routes'
  | 'narrative_content'

export type CrudPageProps<T extends { id: string }> = {
  title: string
  addLabel: string
  emptyMessage: string
  table: CrudTable
  columns: Column<T>[]
  orderBy: { column: string; ascending: boolean }
  filterDeleted?: boolean
  renderForm: (props: {
    initial: T | null
    onSubmit: (values: Record<string, unknown>) => Promise<void>
    onCancel: () => void
    isSubmitting: boolean
  }) => ReactNode
  rowKey?: (row: T) => string
}

export function CrudPage<T extends { id: string }>({
  title,
  addLabel,
  emptyMessage,
  table,
  columns,
  orderBy,
  filterDeleted = true,
  renderForm,
  rowKey = (r) => r.id,
}: CrudPageProps<T>) {
  const { activeSchool } = useSchool()
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null)

  const queryKey = ['crud', table, activeSchool?.id]

  const { data: rows = [], isLoading } = useQuery<T[]>({
    queryKey,
    enabled: !!activeSchool,
    queryFn: async () => {
      if (!activeSchool) return []
      let q = sb.from(table).select('*').eq('school_id', activeSchool.id)
      if (filterDeleted) q = q.is('deleted_at', null)
      q = q.order(orderBy.column, { ascending: orderBy.ascending })
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as T[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (!activeSchool) throw new Error('No active school')
      if (editing) {
        const { error } = await sb.from(table).update(values).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await sb
          .from(table)
          .insert({ ...values, school_id: activeSchool.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Saved' : 'Added')
      queryClient.invalidateQueries({ queryKey })
      setDrawerOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = filterDeleted
        ? await sb.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
        : await sb.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Deleted')
      queryClient.invalidateQueries({ queryKey })
      setConfirmDelete(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openAdd = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = (row: T) => {
    setEditing(row)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-navy">{title}</h1>
        <Button onClick={openAdd} className="bg-navy hover:bg-navy/90">
          <Plus className="mr-2 h-4 w-4" /> {addLabel}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  {columns.map((col) => (
                    <th key={col.header} className="text-left font-medium px-4 py-3">
                      {col.header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)} className="border-t hover:bg-muted/30">
                    {columns.map((col) => (
                      <td
                        key={col.header}
                        className={`px-4 py-3 ${col.className ?? ''} cursor-pointer`}
                        onClick={() => openEdit(row)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(row)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${title.replace(/s$/, '').toLowerCase()}` : addLabel}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {renderForm({
              initial: editing,
              onSubmit: (values) => upsert.mutateAsync(values),
              onCancel: () => {
                setDrawerOpen(false)
                setEditing(null)
              },
              isSubmitting: upsert.isPending,
            })}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The entry will be removed from the parent bot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
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
