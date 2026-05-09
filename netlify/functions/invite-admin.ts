import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let body: { email?: string; schoolId?: string; requesterUserId?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }
  const { email, schoolId, requesterUserId } = body
  if (!email || !schoolId || !requesterUserId) {
    return { statusCode: 400, body: 'Missing fields' }
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { statusCode: 500, body: 'Server not configured' }
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: requesterAdmin, error: checkErr } = await supabase
    .from('school_admins')
    .select('id')
    .eq('user_id', requesterUserId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (checkErr || !requesterAdmin) {
    return { statusCode: 403, body: 'Not authorised' }
  }

  const redirectTo = process.env.ADMIN_REDIRECT_URL || 'https://admin.schools.townconnect.co.za/auth/callback'

  const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (inviteErr || !invite?.user) {
    return { statusCode: 500, body: inviteErr?.message ?? 'Invite failed' }
  }

  const { error: linkErr } = await supabase
    .from('school_admins')
    .upsert(
      {
        school_id: schoolId,
        user_id: invite.user.id,
        email,
        role: 'admin',
        invited_by: requesterUserId,
      },
      { onConflict: 'school_id,user_id' }
    )

  if (linkErr) {
    return { statusCode: 500, body: `Invited but link failed: ${linkErr.message}` }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  }
}
