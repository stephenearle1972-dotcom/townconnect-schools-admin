import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { differenceInDays, format } from 'date-fns'
import { Users, Trophy, Bell, MessageCircle } from 'lucide-react'
import { useSchool } from '@/lib/school'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TRIAL_BOT_E164 = '+27791866145'
const TRIAL_BOT_DIGITS = TRIAL_BOT_E164.replace(/[^0-9]/g, '')

type Counts = { teachers: number; upcoming: number; notices: number }

export default function OverviewPage() {
  const { activeSchool } = useSchool()
  const schoolId = activeSchool?.id

  const { data: counts } = useQuery<Counts>({
    queryKey: ['overview-counts', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      if (!schoolId) return { teachers: 0, upcoming: 0, notices: 0 }
      const today = new Date().toISOString().slice(0, 10)
      const monthStart = new Date()
      monthStart.setDate(1)
      const [tRes, fRes, nRes] = await Promise.all([
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .is('deleted_at', null),
        supabase
          .from('sport_fixtures')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('fixture_date', today)
          .is('deleted_at', null),
        supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('publish_at', monthStart.toISOString())
          .is('deleted_at', null)
          .eq('is_published', true),
      ])
      return {
        teachers: tRes.count ?? 0,
        upcoming: fRes.count ?? 0,
        notices: nRes.count ?? 0,
      }
    },
  })

  const trialEnd = activeSchool?.trial_ends_at ? new Date(activeSchool.trial_ends_at) : null
  const trialDays = trialEnd ? Math.max(0, differenceInDays(trialEnd, new Date())) : null

  const prefix = activeSchool?.trial_bot_prefix ?? ''
  const waLink = `https://wa.me/${TRIAL_BOT_DIGITS}?text=${encodeURIComponent(`${prefix} hi`)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy">{activeSchool?.name}</h1>
        <p className="text-muted-foreground">Welcome back.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial / status</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSchool?.subscription_status === 'active' ? (
              <>
                <div className="text-2xl font-bold text-teal">Paid</div>
                <p className="text-xs text-muted-foreground">
                  Until {activeSchool.paid_until ? format(new Date(activeSchool.paid_until), 'd MMM yyyy') : '—'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-navy">{trialDays ?? 0} days</div>
                <p className="text-xs text-muted-foreground">trial remaining</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.teachers ?? '…'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming fixtures</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.upcoming ?? '…'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notices this month</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.notices ?? '…'}</div>
          </CardContent>
        </Card>
      </div>

      <RecentActivity schoolId={schoolId} />

      <Card className="border-gold/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal" /> Try your bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            While we provision your school's WhatsApp number, parents can reach your bot by texting{' '}
            <strong>"{prefix} [question]"</strong> to the demo number.
          </p>
          <Button asChild className="bg-teal hover:bg-teal/90 text-white">
            <a href={waLink} target="_blank" rel="noreferrer">
              Open WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

type RecentRow = { type: string; title: string; when: string }

function RecentActivity({ schoolId }: { schoolId: string | undefined }) {
  const { data: rows = [] } = useQuery<RecentRow[]>({
    queryKey: ['overview-activity', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      if (!schoolId) return []
      const limit = 10
      const tables: { table: 'teachers' | 'sport_fixtures' | 'calendar_events' | 'notices' | 'fees' | 'bus_routes' | 'narrative_content'; type: string; titleField: string }[] = [
        { table: 'notices', type: 'Notice', titleField: 'title' },
        { table: 'teachers', type: 'Teacher', titleField: 'full_name' },
        { table: 'sport_fixtures', type: 'Fixture', titleField: 'sport' },
        { table: 'calendar_events', type: 'Event', titleField: 'title' },
        { table: 'fees', type: 'Fee', titleField: 'fee_type' },
        { table: 'bus_routes', type: 'Bus route', titleField: 'route_name' },
        { table: 'narrative_content', type: 'Section', titleField: 'title' },
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase
      const results = await Promise.all(
        tables.map(async ({ table, type, titleField }) => {
          const { data } = await sb
            .from(table)
            .select(`${titleField}, updated_at`)
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .limit(limit)
          return (data ?? []).map((row: Record<string, unknown>) => ({
            type,
            title: String(row[titleField] ?? ''),
            when: String(row.updated_at ?? ''),
          }))
        })
      )
      return results
        .flat()
        .sort((a, b) => (a.when < b.when ? 1 : -1))
        .slice(0, limit)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Start by adding a notice or teacher.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="text-muted-foreground">{r.type}:</span>{' '}
                  <span className="font-medium">{r.title}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.when ? format(new Date(r.when), 'd MMM HH:mm') : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-4">
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/notices">Add notice</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/teachers">Add teacher</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
