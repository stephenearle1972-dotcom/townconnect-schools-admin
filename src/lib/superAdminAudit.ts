import { supabase } from './supabase'

export type SuperAdminAction =
  | 'view_school'
  | 'view_school_admins'
  | 'open_as_admin'
  | 'mark_as_paid'
  | 'suspend'
  | 'change_subscription_status'
  | 'other'

type Params = {
  targetSchoolId?: string
  targetSchoolName?: string
  detail?: Record<string, unknown>
}

export async function logSuperAdminAction(action: SuperAdminAction, params: Params = {}) {
  // Best-effort fire-and-forget. We don't block the user's UI if the audit write fails.
  try {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) return
    await fetch('/.netlify/functions/super-admin-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jwt: session.access_token,
        action,
        ...params,
      }),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('super-admin audit write failed', err)
  }
}
