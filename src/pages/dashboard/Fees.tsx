import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CrudPage, type Column } from '@/components/CrudPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type Fee = Database['public']['Tables']['fees']['Row']

const GRADES = [
  'Grade R',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'All grades',
]
const TYPES = ['Tuition', 'Registration', 'Sport', 'Bus', 'Uniform', 'Excursion', 'Other']

const schema = z.object({
  grade: z.string().min(1, 'Grade required'),
  fee_type: z.string().min(1, 'Type required'),
  amount: z.number().nonnegative('Amount must be ≥ 0'),
  due_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n)

const columns: Column<Fee>[] = [
  { header: 'Grade', cell: (f) => <span className="font-medium">{f.grade}</span> },
  { header: 'Type', cell: (f) => f.fee_type },
  { header: 'Amount', cell: (f) => <span className="font-mono">{fmt(Number(f.amount))}</span> },
  { header: 'Due', cell: (f) => (f.due_date ? format(new Date(f.due_date), 'd MMM yyyy') : '—') },
]

function FeeForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Fee | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grade: initial?.grade ?? '',
      fee_type: initial?.fee_type ?? '',
      amount: initial?.amount != null ? Number(initial.amount) : 0,
      due_date: initial?.due_date ?? '',
      description: initial?.description ?? '',
    },
  })

  const submit = (v: FormValues) =>
    onSubmit({
      grade: v.grade,
      fee_type: v.fee_type,
      amount: v.amount,
      due_date: v.due_date || null,
      description: v.description || null,
    })

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Grade</Label>
        <Select value={form.watch('grade')} onValueChange={(v) => form.setValue('grade', v, { shouldDirty: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.grade && (
          <p className="text-sm text-destructive">{form.formState.errors.grade.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={form.watch('fee_type')}
          onValueChange={(v) => form.setValue('fee_type', v, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fee type" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.fee_type && (
          <p className="text-sm text-destructive">{form.formState.errors.fee_type.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (ZAR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...form.register('amount', { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="due_date">Due date</Label>
        <Input id="due_date" type="date" {...form.register('due_date')} />
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

export default function FeesPage() {
  return (
    <CrudPage<Fee>
      title="Fees"
      addLabel="Add fee"
      emptyMessage="No fees set up yet — add tuition and other charges."
      table="fees"
      columns={columns}
      orderBy={{ column: 'grade', ascending: true }}
      renderForm={(p) => <FeeForm {...p} />}
    />
  )
}
