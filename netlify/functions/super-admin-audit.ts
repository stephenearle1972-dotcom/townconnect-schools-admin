import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

type AuditBody = {
  jwt?: string
  action?: string
  targetSchoolId?: string
  targetSchoolName?: string
  detail?: Record<string, unknown>
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let body: AuditBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { jwt, action, targetSchoolId, targetSchoolName, detail } = body
  if (!jwt || !action) {
    return { statusCode: 400, body: 'Missing fields' }
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { statusCode: 500, body: 'Server not configured' }
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Verify the JWT and confirm super-admin
  const { data: userData, error: jwtErr } = await supabase.auth.getUser(jwt)
  if (jwtErr || !userData?.user) {
    return { statusCode: 401, body: 'Invalid session' }
  }

  const { data: superCheck } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (!superCheck) {
    return { statusCode: 403, body: 'Not a super admin' }
  }

  const fwd = event.headers['x-forwarded-for']
  const ip =
    (typeof fwd === 'string' ? fwd.split(',')[0]?.trim() : null) ||
    (event.headers['client-ip'] as string | undefined) ||
    null
  const userAgent = (event.headers['user-agent'] as string | undefined) || null

  const { error: insertErr } = await supabase.from('super_admin_audit').insert({
    super_admin_user_id: userData.user.id,
    super_admin_email: userData.user.email!,
    action,
    target_school_id: targetSchoolId || null,
    target_school_name: targetSchoolName || null,
    detail: detail ?? null,
    ip_address: ip,
    user_agent: userAgent,
  })

  if (insertErr) {
    return { statusCode: 500, body: insertErr.message }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
