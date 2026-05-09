import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSchool } from '@/lib/school'
import { supabase } from '@/lib/supabase'
import { logSuperAdminAction } from '@/lib/superAdminAudit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ImageUpload'
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

type SchoolAdmin = Database['public']['Tables']['school_admins']['Row']

const schema = z.object({
  name: z.string().min(3, 'School name required'),
  principal_name: z.string().optional().or(z.literal('')),
  contact_email: z.string().email(),
  contact_phone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Use SA format'),
  address: z.string().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')).or(z.null()),
})

type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const { activeSchool, refresh } = useSchool()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      principal_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      logo_url: '',
    },
  })

  useEffect(() => {
    if (activeSchool) {
      form.reset({
        name: activeSchool.name,
        principal_name: activeSchool.principal_name ?? '',
        contact_email: activeSchool.contact_email,
        contact_phone: activeSchool.contact_phone ?? '',
        address: activeSchool.address ?? '',
        logo_url: activeSchool.logo_url ?? '',
      })
    }
  }, [activeSchool, form])

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      if (!activeSchool) throw new Error('No active school')
      const { error } = await supabase
        .from('schools')
        .update({
          name: v.name,
          principal_name: v.principal_name || null,
          contact_email: v.contact_email,
          contact_phone: v.contact_phone,
          address: v.address || null,
          logo_url: v.logo_url || null,
        })
        .eq('id', activeSchool.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('School updated')
      refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { data: admins = [] } = useQuery<SchoolAdmin[]>({
    queryKey: ['school-admins', activeSchool?.id],
    enabled: !!activeSchool,
    queryFn: async () => {
      if (!activeSchool) return []
      const { data, error } = await supabase
        .from('school_admins')
        .select('*')
        .eq('school_id', activeSchool.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // Detect cross-school super-admin viewing: super admin AND not a member of this school's admins.
  const { data: isSuperAdmin = false } = useQuery({
    queryKey: ['is-super-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc('is_super_admin')
      return !!data
    },
  })
  const isSchoolMember = !!user && admins.some((a) => a.user_id === user.id)
  const showSuperAdminBanner = isSuperAdmin && !isSchoolMember && admins.length > 0

  // One audit row per session per cross-school view.
  const auditedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!showSuperAdminBanner || !activeSchool) return
    if (auditedRef.current === activeSchool.id) return
    auditedRef.current = activeSchool.id
    void logSuperAdminAction('view_school_admins', {
      targetSchoolId: activeSchool.id,
      targetSchoolName: activeSchool.name,
      detail: { admin_count: admins.length },
    })
  }, [showSuperAdminBanner, activeSchool, admins.length])

  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase.from('school_admins').delete().eq('id', adminId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Admin removed')
      queryClient.invalidateQueries({ queryKey: ['school-admins', activeSchool?.id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendInvite = async () => {
    if (!activeSchool || !user) return
    if (!inviteEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      toast.error('Enter a valid email')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/.netlify/functions/invite-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          schoolId: activeSchool.id,
          requesterUserId: user.id,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Invite failed')
      }
      toast.success('Invite sent')
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['school-admins', activeSchool.id] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  if (!activeSchool) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>School details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageUpload
                value={form.watch('logo_url')}
                onChange={(url) => form.setValue('logo_url', url ?? '', { shouldDirty: true })}
                schoolId={activeSchool.id}
                folder="logos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">School name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="principal_name">Principal name</Label>
              <Input id="principal_name" {...form.register('principal_name')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact email</Label>
                <Input id="contact_email" type="email" {...form.register('contact_email')} />
                {form.formState.errors.contact_email && (
                  <p className="text-sm text-destructive">{form.formState.errors.contact_email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact phone</Label>
                <Input id="contact_phone" {...form.register('contact_phone')} />
                {form.formState.errors.contact_phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.contact_phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} {...form.register('address')} />
            </div>
            <Button type="submit" disabled={save.isPending} className="bg-navy hover:bg-navy/90">
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Trial bot prefix</Label>
            <p className="font-mono text-lg text-navy">{activeSchool.trial_bot_prefix ?? '—'}</p>
            <p className="text-sm text-muted-foreground">
              Parents text "{activeSchool.trial_bot_prefix} [question]" to the demo bot to reach yours.
            </p>
          </div>
          <div>
            <Label>Bot phone number</Label>
            <p className="font-mono text-sm">{activeSchool.bot_phone_e164 ?? 'Not yet assigned'}</p>
            <p className="text-sm text-muted-foreground">Assigned by TownConnect on activation.</p>
          </div>
          <div>
            <Label>Subscription</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  activeSchool.subscription_status === 'active'
                    ? 'default'
                    : activeSchool.subscription_status === 'trial'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {activeSchool.subscription_status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {activeSchool.subscription_status === 'active' && activeSchool.paid_until
                  ? `Paid until ${format(new Date(activeSchool.paid_until), 'd MMM yyyy')}`
                  : activeSchool.trial_ends_at
                    ? `Trial ends ${format(new Date(activeSchool.trial_ends_at), 'd MMM yyyy')}`
                    : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent>
          {showSuperAdminBanner && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>
                You are viewing this school's admin list as a super admin. The admins listed here have not consented to operators seeing their email addresses. Use this view only when investigating a support issue. Every view is logged.
              </span>
            </div>
          )}
          <div className="space-y-2 mb-4">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <p className="font-medium">{a.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.role}
                    {a.accepted_at ? ' · accepted' : ' · invited'}
                  </p>
                </div>
                {a.user_id !== user?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {a.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They will lose access to this school's admin panel.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeAdmin.mutate(a.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="invite@school.co.za"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={sendInvite} disabled={inviting} className="bg-navy hover:bg-navy/90">
              {inviting ? 'Sending…' : 'Invite admin'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
