import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { createSchoolForUser } from '@/lib/schoolSetup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters').max(200),
  principalName: z.string().min(2, 'Principal name is required'),
  contactEmail: z.string().email('Enter a valid email'),
  contactPhone: z
    .string()
    .regex(/^(\+27|0)[0-9]{9}$/, 'Use SA format: +27821234567 or 0821234567'),
  address: z.string().max(500).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function CompleteSignupPage() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [hasSchool, setHasSchool] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('school_admins')
        .select('school_id')
        .eq('user_id', user.id)
        .limit(1)
      if (cancelled) return
      if (error) {
        toast.error(error.message)
        setChecking(false)
        return
      }
      setHasSchool((data ?? []).length > 0)
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      schoolName: '',
      principalName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (user?.email) {
      form.reset({
        schoolName: '',
        principalName: '',
        contactEmail: user.email,
        contactPhone: '',
        address: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
          <p className="mt-4 text-navy">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (hasSchool) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const { schoolId } = await createSchoolForUser(
        {
          schoolName: values.schoolName,
          principalName: values.principalName,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          address: values.address || null,
        },
        user
      )
      localStorage.setItem('tc_active_school', schoolId)
      localStorage.removeItem('tc_pending_signup')
      toast.success('School created — your trial starts now')
      navigate('/dashboard', { replace: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create school'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Finish setting up your school</CardTitle>
          <CardDescription>We just need a few details to get your trial started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School name</Label>
              <Input id="schoolName" {...form.register('schoolName')} placeholder="Highveld Academy" />
              {form.formState.errors.schoolName && (
                <p className="text-sm text-destructive">{form.formState.errors.schoolName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="principalName">Principal full name</Label>
              <Input id="principalName" {...form.register('principalName')} placeholder="Jane Smith" />
              {form.formState.errors.principalName && (
                <p className="text-sm text-destructive">{form.formState.errors.principalName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                {...form.register('contactEmail')}
                placeholder="principal@school.co.za"
              />
              {form.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" {...form.register('contactPhone')} placeholder="+27821234567" />
              {form.formState.errors.contactPhone && (
                <p className="text-sm text-destructive">{form.formState.errors.contactPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">School address (optional)</Label>
              <Input id="address" {...form.register('address')} placeholder="123 Main Road, Johannesburg" />
              {form.formState.errors.address && (
                <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-navy hover:bg-navy/90"
            >
              {form.formState.isSubmitting ? 'Creating school…' : 'Create my school'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-navy"
            >
              Sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
