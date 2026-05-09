import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CrudPage, type Column } from '@/components/CrudPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['calendar_events']['Row']

const CATEGORIES = ['Academic', 'Sport', 'Holiday', 'Meeting', 'Function', 'Exam', 'Other']

const schema = z.object({
  event_date: z.string().min(1, 'Date required'),
  event_end_date: z.string().optional().or(z.literal('')),
  title: z.string().min(2, 'Title required'),
  description: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const columns: Column<Event>[] = [
  { header: 'Date', cell: (e) => format(new Date(e.event_date), 'd MMM yyyy') },
  {
    header: 'End',
    cell: (e) => (e.event_end_date ? format(new Date(e.event_end_date), 'd MMM yyyy') : '—'),
  },
  { header: 'Title', cell: (e) => <span className="font-medium">{e.title}</span> },
  { header: 'Category', cell: (e) => (e.category ? <Badge variant="secondary">{e.category}</Badge> : '—') },
]

function EventForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Event | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      event_date: initial?.event_date ?? '',
      event_end_date: initial?.event_end_date ?? '',
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      category: initial?.category ?? '',
    },
  })

  const submit = (v: FormValues) =>
    onSubmit({
      event_date: v.event_date,
      event_end_date: v.event_end_date || null,
      title: v.title,
      description: v.description || null,
      category: v.category || null,
    })

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="event_date">Date</Label>
          <Input id="event_date" type="date" {...form.register('event_date')} />
          {form.formState.errors.event_date && (
            <p className="text-sm text-destructive">{form.formState.errors.event_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_end_date">End (optional)</Label>
          <Input id="event_end_date" type="date" {...form.register('event_end_date')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register('title')} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={form.watch('category')}
          onValueChange={(v) => form.setValue('category', v, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...form.register('description')} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-navy hover:bg-navy/90">
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

export default function CalendarPage() {
  return (
    <CrudPage<Event>
      title="Calendar Events"
      addLabel="Add event"
      emptyMessage="No events yet — add school dates parents should know."
      table="calendar_events"
      columns={columns}
      orderBy={{ column: 'event_date', ascending: true }}
      renderForm={(p) => <EventForm {...p} />}
    />
  )
}
