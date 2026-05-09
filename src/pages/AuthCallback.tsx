import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { createSchoolForUser, type SchoolDetails } from '@/lib/schoolSetup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SESSION_TIMEOUT_MS = 5000

async function waitForSession(): Promise<Session | null> {
  const { data: initial } = await supabase.auth.getSession()
  if (initial.session) return initial.session

  return new Promise<Session | null>((resolve) => {
    let resolved = false
    const finish = (sess: Session | null) => {
      if (resolved) return
      resolved = true
      sub.unsubscribe()
      clearInterval(poll)
      clearTimeout(timer)
      resolve(sess)
    }

    const { data: subData } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess) finish(sess)
    })
    const sub = subData.subscription

    const poll = setInterval(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) finish(data.session)
    }, 250)

    const timer = setTimeout(() => finish(null), SESSION_TIMEOUT_MS)
  })
}

async function tryVerifyFromQuery(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const tokenHash = params.get('token_hash')
  const type = params.get('type')
  if (!tokenHash || !type) return
  // Supabase JS usually auto-handles this when detectSessionInUrl is enabled,
  // but for older email templates with token_hash params we verify explicitly.
  const allowed = ['signup', 'magiclink', 'invite', 'recovery', 'email_change']
  if (!allowed.includes(type)) return
  await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'signup' | 'magiclink' | 'invite' | 'recovery' | 'email_change',
  })
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const run = async () => {
      try {
        await tryVerifyFromQuery().catch(() => {
          // Ignore — auto-detection or onAuthStateChange may still complete sign-in
        })

        const session = await waitForSession()
        if (!session) {
          setError("Couldn't complete sign-in. Try again.")
          return
        }

        const raw = localStorage.getItem('tc_pending_signup')
        let pending: SchoolDetails | null = null
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed.schoolName === 'string') {
              pending = parsed
            }
          } catch {
            // Corrupt entry — drop it
            localStorage.removeItem('tc_pending_signup')
          }
        }

        if (pending) {
          // Idempotency: if this user already has a school, skip insert.
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

          const { schoolId } = await createSchoolForUser(pending, session.user)
          localStorage.removeItem('tc_pending_signup')
          localStorage.setItem('tc_active_school', schoolId)
          navigate('/dashboard', { replace: true })
          return
        }

        // No pending signup — check if user already has a school.
        const { data: rows, error: rowsErr } = await supabase
          .from('school_admins')
          .select('school_id')
          .eq('user_id', session.user.id)
          .limit(1)
        if (rowsErr) throw rowsErr

        if (rows && rows.length > 0) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/complete-signup', { replace: true })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        setError(msg)
      }
    }
    void run()
  }, [navigate, retryKey])

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Could not finish sign-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  ran.current = false
                  setError(null)
                  setRetryKey((k) => k + 1)
                }}
                className="w-full bg-navy hover:bg-navy/90"
              >
                Try again
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login">Back to sign-in</a>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <a href="mailto:hello@townconnect.co.za?subject=Sign-in%20issue">Contact support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="mt-4 text-navy">Signing you in…</p>
      </div>
    </div>
  )
}
