import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CrudPage, type Column } from '@/components/CrudPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Database } from '@/lib/database.types'

type Fixture = Database['public']['Tables']['sport_fixtures']['Row']

const SPORTS = ['Rugby', 'Netball', 'Hockey', 'Cricket', 'Soccer', 'Athletics', 'Other']

const schema = z.object({
  fixture_date: z.string().min(1, 'Date required'),
  fixture_time: z.string().optional().or(z.literal('')),
  sport: z.string().min(1, 'Sport required'),
  age_group: z.string().optional().or(z.literal('')),
  team: z.string().optional().or(z.literal('')),
  opponent: z.string().optional().or(z.literal('')),
  venue: z.string().optional().or(z.literal('')),
  is_home: z.boolean(),
  notes: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const columns: Column<Fixture>[] = [
  {
    header: 'Date',
    cell: (f) => <span className="font-medium">{format(new Date(f.fixture_date), 'd MMM yyyy')}</span>,
  },
  { header: 'Time', cell: (f) => f.fixture_time ?? '—' },
  { header: 'Sport', cell: (f) => f.sport },
  { header: 'Team', cell: (f) => f.team ?? '—' },
  { header: 'Opponent', cell: (f) => f.opponent ?? '—' },
  {
    header: 'Venue',
    cell: (f) => (
      <span>
        {f.venue ?? '—'}{' '}
        <Badge variant={f.is_home ? 'default' : 'secondary'}>{f.is_home ? 'Home' : 'Away'}</Badge>
      </span>
    ),
  },
]

function FixtureForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: Fixture | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fixture_date: initial?.fixture_date ?? '',
      fixture_time: initial?.fixture_time ?? '',
      sport: initial?.sport ?? '',
      age_group: initial?.age_group ?? '',
      team: initial?.team ?? '',
      opponent: initial?.opponent ?? '',
      venue: initial?.venue ?? '',
      is_home: initial?.is_home ?? true,
      notes: initial?.notes ?? '',
    },
  })

  const submit = (v: FormValues) =>
    onSubmit({
      fixture_date: v.fixture_date,
      fixture_time: v.fixture_time || null,
      sport: v.sport,
      age_group: v.age_group || null,
      team: v.team || null,
      opponent: v.opponent || null,
      venue: v.venue || null,
      is_home: v.is_home,
      notes: v.notes || null,
    })

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fixture_date">Date</Label>
          <Input id="fixture_date" type="date" {...form.register('fixture_date')} />
          {form.formState.errors.fixture_date && (
            <p className="text-sm text-destructive">{form.formState.errors.fixture_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fixture_time">Time</Label>
          <Input id="fixture_time" type="time" {...form.register('fixture_time')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Sport</Label>
        <Select value={form.watch('sport')} onValueChange={(v) => form.setValue('sport', v, { shouldDirty: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.sport && (
          <p className="text-sm text-destructive">{form.formState.errors.sport.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="age_group">Age group</Label>
          <Input id="age_group" {...form.register('age_group')} placeholder="U16" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team">Team</Label>
          <Input id="team" {...form.register('team')} placeholder="1st team" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="opponent">Opponent</Label>
        <Input id="opponent" {...form.register('opponent')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input id="venue" {...form.register('venue')} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_home"
          checked={form.watch('is_home')}
          onCheckedChange={(v) => form.setValue('is_home', v === true, { shouldDirty: true })}
        />
        <Label htmlFor="is_home" className="cursor-pointer">
          Home match
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register('notes')} />
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

export default function FixturesPage() {
  return (
    <CrudPage<Fixture>
      title="Sport Fixtures"
      addLabel="Add fixture"
      emptyMessage="No fixtures added yet — add the next match."
      table="sport_fixtures"
      columns={columns}
      orderBy={{ column: 'fixture_date', ascending: true }}
      renderForm={(p) => <FixtureForm {...p} />}
    />
  )
}
