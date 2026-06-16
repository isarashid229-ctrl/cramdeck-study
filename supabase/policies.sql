-- Row Level Security Policies for EagleCram
-- Run after schema.sql

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own courses" ON courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
DROP POLICY IF EXISTS "Users can view own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can view own assignment steps" ON assignment_steps;
DROP POLICY IF EXISTS "Users can insert own assignment steps" ON assignment_steps;
DROP POLICY IF EXISTS "Users can update own assignment steps" ON assignment_steps;
DROP POLICY IF EXISTS "Users can delete own assignment steps" ON assignment_steps;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can update own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can insert own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can update own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can delete own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can view own reward events" ON reward_events;
DROP POLICY IF EXISTS "Users can insert own reward events" ON reward_events;
DROP POLICY IF EXISTS "Users can delete own reward events" ON reward_events;
DROP POLICY IF EXISTS "Users can view own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can insert own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can update own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can delete own game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can view own game results" ON game_results;
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
DROP POLICY IF EXISTS "Users can delete own game results" ON game_results;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Authenticated users can view avatar items" ON avatar_items;
DROP POLICY IF EXISTS "Users can view own avatar items" ON user_avatar_items;
DROP POLICY IF EXISTS "Users can insert own avatar items" ON user_avatar_items;
DROP POLICY IF EXISTS "Users can update own avatar items" ON user_avatar_items;
DROP POLICY IF EXISTS "Users can delete own avatar items" ON user_avatar_items;
DROP POLICY IF EXISTS "Authenticated users can view achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view own missed questions" ON missed_questions;
DROP POLICY IF EXISTS "Users can insert own missed questions" ON missed_questions;
DROP POLICY IF EXISTS "Users can update own missed questions" ON missed_questions;
DROP POLICY IF EXISTS "Users can delete own missed questions" ON missed_questions;
DROP POLICY IF EXISTS "Users can view own assignment notes" ON assignment_notes;
DROP POLICY IF EXISTS "Users can insert own assignment notes" ON assignment_notes;
DROP POLICY IF EXISTS "Users can update own assignment notes" ON assignment_notes;
DROP POLICY IF EXISTS "Users can delete own assignment notes" ON assignment_notes;
DROP POLICY IF EXISTS "Users can view own course notes" ON course_notes;
DROP POLICY IF EXISTS "Users can insert own course notes" ON course_notes;
DROP POLICY IF EXISTS "Users can update own course notes" ON course_notes;
DROP POLICY IF EXISTS "Users can delete own course notes" ON course_notes;
DROP POLICY IF EXISTS "Users can view own study resources" ON study_resources;
DROP POLICY IF EXISTS "Users can insert own study resources" ON study_resources;
DROP POLICY IF EXISTS "Users can update own study resources" ON study_resources;
DROP POLICY IF EXISTS "Users can delete own study resources" ON study_resources;
DROP POLICY IF EXISTS "Users can view own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can insert own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can update own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can delete own topic mastery" ON topic_mastery;
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can view own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can insert own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can update own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can delete own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can view own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can insert own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can update own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can delete own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can view own external courses" ON external_courses;
DROP POLICY IF EXISTS "Users can insert own external courses" ON external_courses;
DROP POLICY IF EXISTS "Users can update own external courses" ON external_courses;
DROP POLICY IF EXISTS "Users can delete own external courses" ON external_courses;
DROP POLICY IF EXISTS "Users can view own external assignments" ON external_assignments;
DROP POLICY IF EXISTS "Users can insert own external assignments" ON external_assignments;
DROP POLICY IF EXISTS "Users can update own external assignments" ON external_assignments;
DROP POLICY IF EXISTS "Users can delete own external assignments" ON external_assignments;
DROP POLICY IF EXISTS "Users can view own sync runs" ON sync_runs;
DROP POLICY IF EXISTS "Users can insert own sync runs" ON sync_runs;
DROP POLICY IF EXISTS "Users can update own sync runs" ON sync_runs;
DROP POLICY IF EXISTS "Users can delete own sync runs" ON sync_runs;
DROP POLICY IF EXISTS "Users can view own import batches" ON import_batches;
DROP POLICY IF EXISTS "Users can insert own import batches" ON import_batches;
DROP POLICY IF EXISTS "Users can update own import batches" ON import_batches;
DROP POLICY IF EXISTS "Users can delete own import batches" ON import_batches;
DROP POLICY IF EXISTS "Users can view own import candidates" ON import_candidates;
DROP POLICY IF EXISTS "Users can insert own import candidates" ON import_candidates;
DROP POLICY IF EXISTS "Users can update own import candidates" ON import_candidates;
DROP POLICY IF EXISTS "Users can delete own import candidates" ON import_candidates;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Users can view own courses"
  ON courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON courses FOR DELETE
  USING (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Assignment steps policies (via assignment ownership)
CREATE POLICY "Users can view own assignment steps"
  ON assignment_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_steps.assignment_id
      AND assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own assignment steps"
  ON assignment_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_steps.assignment_id
      AND assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own assignment steps"
  ON assignment_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_steps.assignment_id
      AND assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own assignment steps"
  ON assignment_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_steps.assignment_id
      AND assignments.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Quiz attempt policies
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz attempts"
  ON quiz_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- Quiz question policies (via attempt ownership)
CREATE POLICY "Users can view own quiz questions"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_questions.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quiz questions"
  ON quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_questions.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quiz questions"
  ON quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_questions.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quiz questions"
  ON quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_questions.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- Reward event policies
CREATE POLICY "Users can view own reward events"
  ON reward_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reward events"
  ON reward_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reward events"
  ON reward_events FOR DELETE
  USING (auth.uid() = user_id);

-- Game result policies
CREATE POLICY "Users can view own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game sessions"
  ON game_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own game results"
  ON game_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game results"
  ON game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own game results"
  ON game_results FOR DELETE
  USING (auth.uid() = user_id);

-- User preference policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Avatar catalog is readable by signed-in users, not writable from the client
CREATE POLICY "Authenticated users can view avatar items"
  ON avatar_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own avatar items"
  ON user_avatar_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar items"
  ON user_avatar_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar items"
  ON user_avatar_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatar items"
  ON user_avatar_items FOR DELETE
  USING (auth.uid() = user_id);

-- Achievement catalog is readable by signed-in users, not writable from the client
CREATE POLICY "Authenticated users can view achievements"
  ON achievements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Missed question policies
CREATE POLICY "Users can view own missed questions"
  ON missed_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missed questions"
  ON missed_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missed questions"
  ON missed_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own missed questions"
  ON missed_questions FOR DELETE
  USING (auth.uid() = user_id);

-- Assignment note policies
CREATE POLICY "Users can view own assignment notes"
  ON assignment_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignment notes"
  ON assignment_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignment notes"
  ON assignment_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignment notes"
  ON assignment_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Course note policies
CREATE POLICY "Users can view own course notes"
  ON course_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course notes"
  ON course_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course notes"
  ON course_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own course notes"
  ON course_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Learning and review policies
CREATE POLICY "Users can view own study resources"
  ON study_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study resources"
  ON study_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study resources"
  ON study_resources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study resources"
  ON study_resources FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own topic mastery"
  ON topic_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic mastery"
  ON topic_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic mastery"
  ON topic_mastery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topic mastery"
  ON topic_mastery FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans"
  ON study_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Integration and import policies
CREATE POLICY "Users can view own connected accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own external courses"
  ON external_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external courses"
  ON external_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external courses"
  ON external_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own external courses"
  ON external_courses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own external assignments"
  ON external_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external assignments"
  ON external_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external assignments"
  ON external_assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own external assignments"
  ON external_assignments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync runs"
  ON sync_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync runs"
  ON sync_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync runs"
  ON sync_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync runs"
  ON sync_runs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own import batches"
  ON import_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import batches"
  ON import_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import batches"
  ON import_batches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import batches"
  ON import_batches FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own import candidates"
  ON import_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import candidates"
  ON import_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import candidates"
  ON import_candidates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import candidates"
  ON import_candidates FOR DELETE
  USING (auth.uid() = user_id);

-- EagleCram Supabase Storage policies
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
