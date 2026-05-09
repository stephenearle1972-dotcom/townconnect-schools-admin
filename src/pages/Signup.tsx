import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters').max(200),
  principalName: z.string().min(2, 'Principal name is required'),
  contactEmail: z.string().email('Enter a valid email'),
  contactPhone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Use SA format: +27821234567 or 0821234567'),
  address: z.string().max(500).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { schoolName: '', principalName: '', contactEmail: '', contactPhone: '', address: '' },
  })

  const onSubmit = async (values: FormValues) => {
    // Same-device fast path
    localStorage.setItem('tc_pending_signup', JSON.stringify(values))
    const { error } = await supabase.auth.signInWithOtp({
      email: values.contactEmail,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
        shouldCreateUser: true,
        // Persist sign-up details to auth.users.user_metadata so the magic link
        // works even when the user clicks it on a different device/browser.
        data: {
          full_name: values.principalName,
          pending_school: {
            name: values.schoolName,
            principal_name: values.principalName,
            contact_email: values.contactEmail,
            contact_phone: values.contactPhone,
            address: values.address ?? null,
          },
        },
      },
    })
    if (error) {
      toast.error(`Could not send magic link: ${error.message}`)
      return
    }
    setSubmittedEmail(values.contactEmail)
    setSubmitted(true)
    startCooldown()
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const resend = async () => {
    if (resendCooldown > 0) return
    const { error } = await supabase.auth.signInWithOtp({
      email: submittedEmail,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Magic link sent again')
      startCooldown()
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a magic link to <strong>{submittedEmail}</strong>. Click it to finish creating your school.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={resend} disabled={resendCooldown > 0} variant="outline" className="w-full">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend magic link'}
            </Button>
            <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-navy">
              ← Back to home
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Create your school's admin</CardTitle>
          <CardDescription>14 days free. No credit card required.</CardDescription>
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
              {form.formState.isSubmitting ? 'Sending magic link…' : 'Continue'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-navy hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
