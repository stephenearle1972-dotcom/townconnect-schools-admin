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

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const send = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    })
    if (error) {
      toast.error(error.message)
      return false
    }
    return true
  }

  const onSubmit = async (values: FormValues) => {
    const ok = await send(values.email)
    if (!ok) return
    setSubmittedEmail(values.email)
    setSubmitted(true)
    startCooldown()
  }

  const startCooldown = () => {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to <strong>{submittedEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              disabled={cooldown > 0}
              onClick={async () => {
                const ok = await send(submittedEmail)
                if (ok) {
                  toast.success('Link resent')
                  startCooldown()
                }
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
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
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>We'll email you a magic link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} placeholder="you@school.co.za" />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-navy hover:bg-navy/90"
            >
              {form.formState.isSubmitting ? 'Sending…' : 'Email me a link'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New school?{' '}
            <Link to="/signup" className="text-navy hover:underline">
              Sign up free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
