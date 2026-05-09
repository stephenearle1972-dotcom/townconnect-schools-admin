-- =====================================================
-- Storage buckets created via storage.buckets insert (not migration)
--   school-files: private, 10MB limit
--   school-images: public, 5MB limit, image MIME only
-- =====================================================

-- Storage policies for school-files (private)
create policy "schools_can_read_own_files" on storage.objects
  for select using (
    bucket_id = 'school-files'
    and (storage.foldername(name))[1]::uuid in (select public.user_school_ids())
  );

create policy "schools_can_upload_own_files" on storage.objects
  for insert with check (
    bucket_id = 'school-files'
    and (storage.foldername(name))[1]::uuid in (select public.user_school_ids())
  );

create policy "schools_can_delete_own_files" on storage.objects
  for delete using (
    bucket_id = 'school-files'
    and (storage.foldername(name))[1]::uuid in (select public.user_school_ids())
  );

-- Storage policies for school-images (public read, school-scoped write)
create policy "anyone_can_read_school_images" on storage.objects
  for select using (bucket_id = 'school-images');

create policy "schools_can_upload_own_images" on storage.objects
  for insert with check (
    bucket_id = 'school-images'
    and (storage.foldername(name))[1]::uuid in (select public.user_school_ids())
  );

create policy "schools_can_delete_own_images" on storage.objects
  for delete using (
    bucket_id = 'school-images'
    and (storage.foldername(name))[1]::uuid in (select public.user_school_ids())
  );
