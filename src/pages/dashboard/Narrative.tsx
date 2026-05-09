import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { CrudPage, type Column } from '@/components/CrudPage'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/lib/school'
import type { Database } from '@/lib/database.types'

type Narrative = Database['public']['Tables']['narrative_content']['Row']

const SEED_SLUGS = [
  { slug: 'welcome', title: 'Welcome' },
  { slug: 'mission', title: 'Mission' },
  { slug: 'ethos', title: 'Ethos' },
  { slug: 'uniform-policy', title: 'Uniform policy' },
  { slug: 'admissions', title: 'Admissions' },
  { slug: 'discipline', title: 'Discipline' },
  { slug: 'contact-info', title: 'Contact info' },
]

const schema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  title: z.string().min(2),
  body: z.string().min(2),
  display_order: z.number().int().min(0),
})

type FormValues = z.infer<typeof schema>

const columns: Column<Narrative>[] = [
  { header: 'Slug', cell: (n) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{n.slug}</code> },
  { header: 'Title', cell: (n) => <span className="font-medium">{n.title}</span> },
  {
    header: 'Last updated',
    cell: (n) => <span className="text-sm text-muted-foreground">{format(new Date(n.updated_at), 'd MMM yyyy')}</span>,
  },
]

function NarrativeForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Narrative | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: initial?.slug ?? '',
      title: initial?.title ?? '',
      body: initial?.body ?? '',
      display_order: initial?.display_order ?? 0,
    },
  })

  const submit = (v: FormValues) =>
    onSubmit({ slug: v.slug, title: v.title, body: v.body, display_order: v.display_order })

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...form.register('slug')} placeholder="welcome" />
        {form.formState.errors.slug && (
          <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>
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
        />
        {form.formState.errors.body && (
          <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_order">Display order</Label>
        <Input
          id="display_order"
          type="number"
          {...form.register('display_order', { valueAsNumber: true })}
        />
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

export default function NarrativePage() {
  const { activeSchool } = useSchool()
  const queryClient = useQueryClient()
  const seeded = useRef(false)

  useEffect(() => {
    if (!activeSchool || seeded.current) return
    seeded.current = true
    void (async () => {
      const { data: existing } = await supabase
        .from('narrative_content')
        .select('id')
        .eq('school_id', activeSchool.id)
        .limit(1)
      if (existing && existing.length > 0) return
      await supabase.from('narrative_content').insert(
        SEED_SLUGS.map((s, i) => ({
          school_id: activeSchool.id,
          slug: s.slug,
          title: s.title,
          body: '<p>Tell parents about your school here.</p>',
          display_order: i,
        }))
      )
      queryClient.invalidateQueries({ queryKey: ['crud', 'narrative_content', activeSchool.id] })
    })()
  }, [activeSchool, queryClient])

  return (
    <CrudPage<Narrative>
      title="About / Narrative"
      addLabel="Add section"
      emptyMessage="No narrative sections yet."
      table="narrative_content"
      columns={columns}
      orderBy={{ column: 'display_order', ascending: true }}
      renderForm={(p) => <NarrativeForm {...p} />}
    />
  )
}
