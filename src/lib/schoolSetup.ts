import { supabase } from './supabase'

const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789'

export function randomSuffix(len: number) {
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)]
  return out
}

export function buildSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base}-${randomSuffix(4)}`
}

export function buildPrefix(name: string) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 4)
  return initials || randomSuffix(3).toUpperCase()
}

export async function uniquePrefix(base: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 90 + 10)}`
    const { data } = await supabase
      .from('schools')
      .select('id')
      .eq('trial_bot_prefix', candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  return `${base}${randomSuffix(3).toUpperCase()}`
}

export type SchoolDetails = {
  schoolName: string
  principalName: string
  contactEmail: string
  contactPhone: string
  address?: string | null
}

export async function createSchoolForUser(
  details: SchoolDetails,
  user: { id: string; email?: string | null }
): Promise<{ schoolId: string }> {
  // Generate the school id client-side so we never need INSERT...RETURNING.
  // RETURNING would fail RLS: the user only becomes admin of the row AFTER the
  // school_admins link is written, so a SELECT on the freshly-inserted school
  // row before linking violates the schools_select_own policy.
  const schoolId = crypto.randomUUID()
  const slug = buildSlug(details.schoolName)
  const prefix = await uniquePrefix(buildPrefix(details.schoolName))

  const { error: schoolErr } = await supabase.from('schools').insert({
    id: schoolId,
    slug,
    name: details.schoolName,
    principal_name: details.principalName,
    contact_email: details.contactEmail,
    contact_phone: details.contactPhone,
    address: details.address || null,
    trial_bot_prefix: prefix,
    short_code: prefix,
  })
  if (schoolErr) throw schoolErr

  const { error: linkErr } = await supabase.from('school_admins').insert({
    school_id: schoolId,
    user_id: user.id,
    email: user.email ?? details.contactEmail,
    full_name: details.principalName,
    role: 'admin',
    accepted_at: new Date().toISOString(),
  })
  if (linkErr) throw linkErr

  return { schoolId }
}
