import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CrudPage, type Column } from '@/components/CrudPage'
import { ChipsInput } from '@/components/ChipsInput'
import { ImageUpload } from '@/components/ImageUpload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSchool } from '@/lib/school'
import type { Database } from '@/lib/database.types'

type Teacher = Database['public']['Tables']['teachers']['Row']

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  subjects: z.array(z.string()),
  grades: z.array(z.string()),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  photo_url: z.string().url().optional().or(z.literal('')).or(z.null()),
})

type FormValues = z.infer<typeof schema>

const columns: Column<Teacher>[] = [
  {
    header: 'Photo',
    cell: (t) => (
      <Avatar className="h-10 w-10">
        {t.photo_url && <AvatarImage src={t.photo_url} alt={t.full_name} />}
        <AvatarFallback>{t.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    ),
  },
  { header: 'Name', cell: (t) => <span className="font-medium">{t.full_name}</span> },
  {
    header: 'Subjects',
    cell: (t) => (
      <div className="flex flex-wrap gap-1">
        {(t.subjects ?? []).map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    header: 'Grades',
    cell: (t) => (
      <div className="flex flex-wrap gap-1">
        {(t.grades ?? []).map((g) => (
          <Badge key={g} variant="outline">
            {g}
          </Badge>
        ))}
      </div>
    ),
  },
  { header: 'Email', cell: (t) => <span className="text-sm text-muted-foreground">{t.email || '—'}</span> },
  { header: 'Phone', cell: (t) => <span className="text-sm text-muted-foreground">{t.phone || '—'}</span> },
]

function TeacherForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Teacher | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const { activeSchool } = useSchool()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initial?.full_name ?? '',
      subjects: initial?.subjects ?? [],
      grades: initial?.grades ?? [],
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      bio: initial?.bio ?? '',
      photo_url: initial?.photo_url ?? '',
    },
  })

  const submit = (values: FormValues) => {
    return onSubmit({
      full_name: values.full_name,
      subjects: values.subjects,
      grades: values.grades,
      email: values.email || null,
      phone: values.phone || null,
      bio: values.bio || null,
      photo_url: values.photo_url || null,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Photo</Label>
        {activeSchool && (
          <ImageUpload
            value={form.watch('photo_url')}
            onChange={(url) => form.setValue('photo_url', url ?? '', { shouldDirty: true })}
            schoolId={activeSchool.id}
            folder="teachers"
          />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...form.register('full_name')} />
        {form.formState.errors.full_name && (
          <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Subjects</Label>
        <ChipsInput
          value={form.watch('subjects')}
          onChange={(v) => form.setValue('subjects', v, { shouldDirty: true })}
          placeholder="e.g. Mathematics"
        />
      </div>
      <div className="space-y-2">
        <Label>Grades</Label>
        <ChipsInput
          value={form.watch('grades')}
          onChange={(v) => form.setValue('grades', v, { shouldDirty: true })}
          placeholder="e.g. 10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...form.register('phone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={3} {...form.register('bio')} />
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

export default function TeachersPage() {
  return (
    <CrudPage<Teacher>
      title="Teachers"
      addLabel="Add teacher"
      emptyMessage="No teachers added yet — add your first one."
      table="teachers"
      columns={columns}
      orderBy={{ column: 'display_order', ascending: true }}
      renderForm={(p) => <TeacherForm {...p} />}
    />
  )
}
