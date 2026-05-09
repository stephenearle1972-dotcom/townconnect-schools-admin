import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, Plus } from 'lucide-react'
import { CrudPage, type Column } from '@/components/CrudPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Database, Json } from '@/lib/database.types'

type BusRoute = Database['public']['Tables']['bus_routes']['Row']

const stopSchema = z.object({
  stop_name: z.string().min(1, 'Stop name required'),
  morning_pickup: z.string().optional().or(z.literal('')),
  afternoon_dropoff: z.string().optional().or(z.literal('')),
})

const schema = z.object({
  route_name: z.string().min(2, 'Route name required'),
  description: z.string().optional().or(z.literal('')),
  monthly_fee: z.union([z.number().min(0), z.literal('')]),
  contact_name: z.string().optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  stops: z.array(stopSchema),
})

type FormValues = z.infer<typeof schema>

const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n)

const columns: Column<BusRoute>[] = [
  { header: 'Route', cell: (r) => <span className="font-medium">{r.route_name}</span> },
  {
    header: 'Stops',
    cell: (r) => (Array.isArray(r.stops) ? r.stops.length : 0),
  },
  {
    header: 'Monthly fee',
    cell: (r) => (r.monthly_fee != null ? <span className="font-mono">{fmt(Number(r.monthly_fee))}</span> : '—'),
  },
  {
    header: 'Contact',
    cell: (r) => (
      <span className="text-sm text-muted-foreground">
        {r.contact_name ?? '—'}
        {r.contact_phone ? ` · ${r.contact_phone}` : ''}
      </span>
    ),
  },
]

type StopJson = { stop_name: string; morning_pickup: string; afternoon_dropoff: string }

function readStops(stops: Json | null): StopJson[] {
  if (!Array.isArray(stops)) return []
  const out: StopJson[] = []
  for (const s of stops) {
    if (typeof s === 'object' && s !== null && !Array.isArray(s)) {
      const o = s as Record<string, unknown>
      if (typeof o.stop_name === 'string') {
        out.push({
          stop_name: o.stop_name,
          morning_pickup: typeof o.morning_pickup === 'string' ? o.morning_pickup : '',
          afternoon_dropoff: typeof o.afternoon_dropoff === 'string' ? o.afternoon_dropoff : '',
        })
      }
    }
  }
  return out
}

function BusRouteForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: BusRoute | null
  onSubmit: (v: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      route_name: initial?.route_name ?? '',
      description: initial?.description ?? '',
      monthly_fee: initial?.monthly_fee != null ? Number(initial.monthly_fee) : '',
      contact_name: initial?.contact_name ?? '',
      contact_phone: initial?.contact_phone ?? '',
      stops: readStops(initial?.stops ?? null),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'stops' })

  const submit = (v: FormValues) => {
    const stops = v.stops.map((s) => ({
      stop_name: s.stop_name,
      morning_pickup: s.morning_pickup || null,
      afternoon_dropoff: s.afternoon_dropoff || null,
    }))
    const morningTimes: Record<string, string> = {}
    const afternoonTimes: Record<string, string> = {}
    v.stops.forEach((s) => {
      if (s.morning_pickup) morningTimes[s.stop_name] = s.morning_pickup
      if (s.afternoon_dropoff) afternoonTimes[s.stop_name] = s.afternoon_dropoff
    })
    return onSubmit({
      route_name: v.route_name,
      description: v.description || null,
      monthly_fee: v.monthly_fee === '' ? null : Number(v.monthly_fee),
      contact_name: v.contact_name || null,
      contact_phone: v.contact_phone || null,
      stops,
      morning_pickup_times: morningTimes,
      afternoon_dropoff_times: afternoonTimes,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="route_name">Route name</Label>
        <Input id="route_name" {...form.register('route_name')} />
        {form.formState.errors.route_name && (
          <p className="text-sm text-destructive">{form.formState.errors.route_name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={2} {...form.register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="monthly_fee">Monthly fee (ZAR)</Label>
          <Input
            id="monthly_fee"
            type="number"
            step="0.01"
            {...form.register('monthly_fee', {
              setValueAs: (v) => (v === '' || v == null ? '' : Number(v)),
            })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input id="contact_name" {...form.register('contact_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input id="contact_phone" {...form.register('contact_phone')} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Stops</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ stop_name: '', morning_pickup: '', afternoon_dropoff: '' })}
          >
            <Plus className="mr-1 h-4 w-4" /> Add stop
          </Button>
        </div>
        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No stops added yet.</p>
          )}
          {fields.map((f, i) => (
            <div key={f.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
              <Input placeholder="Stop name" {...form.register(`stops.${i}.stop_name`)} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="time" placeholder="Morning pickup" {...form.register(`stops.${i}.morning_pickup`)} />
                <Input type="time" placeholder="Afternoon dropoff" {...form.register(`stops.${i}.afternoon_dropoff`)} />
              </div>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => remove(i)}>
                <Trash2 className="mr-1 h-4 w-4" /> Remove stop
              </Button>
            </div>
          ))}
        </div>
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

export default function BusRoutesPage() {
  return (
    <CrudPage<BusRoute>
      title="Bus Routes"
      addLabel="Add route"
      emptyMessage="No bus routes added yet."
      table="bus_routes"
      columns={columns}
      orderBy={{ column: 'route_name', ascending: true }}
      renderForm={(p) => <BusRouteForm {...p} />}
    />
  )
}
