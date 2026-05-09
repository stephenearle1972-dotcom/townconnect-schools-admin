import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CrudPage, type Column } from '@/components/CrudPage'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type Notice = Database['public']['Tables']['notices']['Row']

const URGENCY = ['low', 'normal', 'high', 'urgent'] as const

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  body: z.string().min(2, 'Body required'),
  urgency: z.enum(URGENCY),
  publish_at: z.string().min(1, 'Publish time required'),
  expires_at: z.string().optional().or(z.literal('')),
  is_published: z.boolean(),
})

type FormValues = z.infer<typeof schema>

function urgencyVariant(u: string | null): 'default' | 'secondary' | 'destructive' {
  if (u === 'urgent' || u === 'high') return 'destructive'
  if (u === 'low') return 'secondary'
  return 'default'
}

function statusOf(n: Notice): 'Published' | 'Draft' | 'Expired' {
  if (!n.is_published) return 'Draft'
  if (n.expires_at && new Date(n.expires_at) < new Date()) return 'Expired'
  return 'Published'
}

const columns: Column<Notice>[] = [
  {
    header: 'Publish date',
    cell: (n) => (n.publish_at ? format(new Date(n.publish_at), 'd MMM yyyy') : '—'),
  },
  { header: 'Title', cell: (n) => <span className="font-medium">{n.title}</span> },
  {
    header: 'Urgency',
    cell: (n) => <Badge variant={urgencyVariant(n.urgency)}>{n.urgency ?? 'normal'}</Badge>,
  },
  {
    header: 'Status',
    cell: (n) => {
      const s = statusOf(n)
      return (
        <Badge variant={s === 'Published' ? 'default' : s === 'Draft' ? 'secondary' : 'destructive'}>
          {s}
        </Badge>
      )
    },
  },
]

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

function NoticeForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Notice | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      body: initial?.body ?? '',
      urgency: ((initial?.urgency as (typeof URGENCY)[number]) ?? 'normal'),
      publish_at: toLocalInput(initial?.publish_at ?? new Date().toISOString()),
      expires_at: toLocalInput(initial?.expires_at ?? null),
      is_published: initial?.is_published ?? true,
    },
  })

  const submit = (v: FormValues) =>
    onSubmit({
      title: v.title,
      body: v.body,
      urgency: v.urgency,
      publish_at: v.publish_at ? new Date(v.publish_at).toISOString() : null,
      expires_at: v.expires_at ? new Date(v.expires_at).toISOString() : null,
      is_published: v.is_published,
    })

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register('title')} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Body</Label>
        <RichTextEditor
          value={form.watch('body')}
          onChange={(v) => form.setValue('body', v, { shouldDirty: true })}
          placeholder="What do parents need to know?"
        />
        {form.formState.errors.body && (
          <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Urgency</Label>
        <Select
          value={form.watch('urgency')}
          onValueChange={(v) => form.setValue('urgency', v as (typeof URGENCY)[number], { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {URGENCY.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="publish_at">Publish at</Label>
          <Input id="publish_at" type="datetime-local" {...form.register('publish_at')} />
          {form.formState.errors.publish_at && (
            <p className="text-sm text-destructive">{form.formState.errors.publish_at.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires_at">Expires at (optional)</Label>
          <Input id="expires_at" type="datetime-local" {...form.register('expires_at')} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_published"
          checked={form.watch('is_published')}
          onCheckedChange={(v) => form.setValue('is_published', v === true, { shouldDirty: true })}
        />
        <Label htmlFor="is_published" className="cursor-pointer">
          Published (visible to parents)
        </Label>
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

export default function NoticesPage() {
  return (
    <CrudPage<Notice>
      title="Notices"
      addLabel="Add notice"
      emptyMessage="No notices yet — share what's happening this week."
      table="notices"
      columns={columns}
      orderBy={{ column: 'publish_at', ascending: false }}
      renderForm={(p) => <NoticeForm {...p} />}
    />
  )
}
