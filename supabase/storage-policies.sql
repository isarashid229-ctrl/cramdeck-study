-- CramDeck Scholar Supabase Storage policies
-- Run this in Supabase SQL Editor after the assignments bucket exists,
-- or run it directly to create the bucket and policies together.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assignments', 'assignments', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = 10485760;


DROP POLICY IF EXISTS "Users can upload own assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own assignment files" ON storage.objects;

CREATE POLICY "Users can upload own assignment files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'assignments'
  );

CREATE POLICY "Users can view own assignment files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'assignments'
  );

CREATE POLICY "Users can update own assignment files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'assignments'
  )
  WITH CHECK (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'assignments'
  );

CREATE POLICY "Users can delete own assignment files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'assignments'
  );
