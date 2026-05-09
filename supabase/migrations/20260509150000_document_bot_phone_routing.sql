comment on column public.schools.bot_phone_number_id is
  'Meta WhatsApp Cloud API phone_number_id. MUST be NULL for schools using the shared trial bot number. Set ONLY when a school upgrades to a dedicated WhatsApp number assigned to them alone. The lookup function get_school_by_prefix_or_phone prefers phone-id matches over prefix matches, so setting this to a shared number routes every prefix on that number to this school, breaking multi-tenant routing for all other schools sharing it.';

comment on column public.schools.bot_phone_e164 is
  'Display-only E.164 number for the school''s bot (e.g. +27791866145). Same NULL-on-shared rule as bot_phone_number_id. Never used for routing; routing keys off bot_phone_number_id only.';

comment on column public.schools.trial_bot_prefix is
  'Short uppercase code (2-6 chars) parents prefix to messages on the shared trial bot number. e.g. parent texts "HVA fees grade 10" and the bot looks up the school whose trial_bot_prefix = HVA. Required and unique. Stays set even after a school upgrades to a dedicated number — provides a fallback path.';
