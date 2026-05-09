import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PendingSignup = {
  schoolName: string
  principalName: string
  contactEmail: string
  contactPhone: string
  address?: string
}

const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789'

function randomSuffix(len: number) {
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)]
  return out
}

function buildSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base}-${randomSuffix(4)}`
}

function buildPrefix(name: string) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 4)
  return initials || randomSuffix(3).toUpperCase()
}

async function uniquePrefix(base: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 90 + 10)}`
    const { data } = await supabase.from('schools').select('id').eq('trial_bot_prefix', candidate).maybeSingle()
    if (!data) return candidate
  }
  return `${base}${randomSuffix(3).toUpperCase()}`
}

export default function AuthCallbackPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!session) {
      navigate('/login', { replace: true })
      return
    }

    const run = async () => {
      try {
        const raw = localStorage.getItem('tc_pending_signup')
        if (!raw) {
          navigate('/dashboard', { replace: true })
          return
        }
        const pending: PendingSignup = JSON.parse(raw)

        const { data: existing, error: existingErr } = await supabase
          .from('school_admins')
          .select('school_id')
          .eq('user_id', session.user.id)
          .limit(1)
        if (existingErr) throw existingErr
        if (existing && existing.length > 0) {
          localStorage.removeItem('tc_pending_signup')
          navigate('/dashboard', { replace: true })
          return
        }

        const slug = buildSlug(pending.schoolName)
        const prefix = await uniquePrefix(buildPrefix(pending.schoolName))
        const shortCode = prefix

        const { data: school, error: schoolErr } = await supabase
          .from('schools')
          .insert({
            slug,
            name: pending.schoolName,
            principal_name: pending.principalName,
            contact_email: pending.contactEmail,
            contact_phone: pending.contactPhone,
            address: pending.address || null,
            trial_bot_prefix: prefix,
            short_code: shortCode,
          })
          .select()
          .single()
        if (schoolErr) throw schoolErr

        const { error: linkErr } = await supabase.from('school_admins').insert({
          school_id: school.id,
          user_id: session.user.id,
          email: session.user.email!,
          full_name: pending.principalName,
          role: 'admin',
          accepted_at: new Date().toISOString(),
        })
        if (linkErr) throw linkErr

        localStorage.removeItem('tc_pending_signup')
        localStorage.setItem('tc_active_school', school.id)
        navigate('/dashboard', { replace: true })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        setError(msg)
        setBusy(false)
      }
    }
    run()
  }, [session, loading, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Could not finish sign-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:hello@townconnect.co.za">Contact support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="mt-4 text-navy">{busy ? 'Setting up your school…' : 'Redirecting…'}</p>
      </div>
    </div>
  )
}
