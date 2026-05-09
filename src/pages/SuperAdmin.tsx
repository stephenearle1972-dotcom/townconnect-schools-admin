import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Database } from '@/lib/database.types'

type SchoolRow = Database['public']['Tables']['schools']['Row']
type SchoolWithAdmins = SchoolRow & {
  school_admins: { email: string }[]
}

const SUPER_EMAILS = (import.meta.env.VITE_SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean)

export default function SuperAdminPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const userEmail = (user?.email ?? '').toLowerCase()
  const allowedByEnv = SUPER_EMAILS.includes(userEmail)

  const { data: isSuperAdmin = false } = useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase.rpc('is_super_admin')
      return !!data
    },
    enabled: !!user,
  })

  const authorised = allowedByEnv || isSuperAdmin

  const { data: schools = [], isLoading } = useQuery<SchoolWithAdmins[]>({
    queryKey: ['super-schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*, school_admins(email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as SchoolWithAdmins[]
    },
    enabled: authorised,
  })

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const paidUntil = new Date()
      paidUntil.setFullYear(paidUntil.getFullYear() + 1)
      const { error } = await supabase
        .from('schools')
        .update({ subscription_status: 'active', paid_until: paidUntil.toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Marked as paid for 1 year')
      queryClient.invalidateQueries({ queryKey: ['super-schools'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const suspend = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schools')
        .update({ subscription_status: 'read_only' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Suspended')
      queryClient.invalidateQueries({ queryKey: ['super-schools'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openAsAdmin = (id: string) => {
    localStorage.setItem('tc_active_school', id)
    navigate('/dashboard')
  }

  if (!authorised) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not authorised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is not on the super admin list. Sign out and use the correct account.
            </p>
            <Button variant="outline" onClick={signOut} className="mt-4">
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-navy">TownConnect Schools</span>
            <Badge className="bg-gold text-navy">Super admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              My dashboard
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8">
        <h1 className="text-3xl font-bold text-navy mb-6">All schools</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : schools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No schools yet</CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial / Paid until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((s) => {
                  const admin = s.school_admins?.[0]?.email ?? '—'
                  const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at) : null
                  const paidUntil = s.paid_until ? new Date(s.paid_until) : null
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{admin}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.subscription_status === 'active'
                              ? 'default'
                              : s.subscription_status === 'trial'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {s.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.subscription_status === 'active' && paidUntil
                          ? `Paid until ${format(paidUntil, 'd MMM yyyy')}`
                          : trialEnd
                            ? formatDistanceToNow(trialEnd, { addSuffix: true })
                            : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(s.created_at), 'd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openAsAdmin(s.id)}>
                          Open
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Mark paid
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark {s.name} as paid?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sets status to active and paid_until to one year from now.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => markPaid.mutate(s.id)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              Suspend
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Suspend {s.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sets the school to read-only mode. The bot will stop replying.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => suspend.mutate(s.id)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  )
}
