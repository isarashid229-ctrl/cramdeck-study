-- CramDeck Scholar Database Schema
-- Run this in your Supabase SQL Editor after creating a project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school_name TEXT,
  grade_level TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  points INT DEFAULT 0 NOT NULL,
  streak_count INT DEFAULT 0 NOT NULL,
  equipped_title TEXT DEFAULT 'Rookie Scholar',
  unlocked_titles TEXT[] DEFAULT ARRAY['Rookie Scholar'],
  unlocked_cosmetics TEXT[] DEFAULT ARRAY['hair-classic','outfit-hoodie','accessory-none','background-desk','effect-none'],
  avatar_config JSONB DEFAULT '{"hair":"hair-classic","outfit":"outfit-hoodie","accessory":"accessory-none","background":"background-desk","effect":"effect-none","color":"indigo"}'::jsonb,
  last_reward_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Existing projects: add reward/avatar columns if the profiles table already existed.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title TEXT DEFAULT 'Rookie Scholar';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_titles TEXT[] DEFAULT ARRAY['Rookie Scholar'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_cosmetics TEXT[] DEFAULT ARRAY['hair-classic','outfit-hoodie','accessory-none','background-desk','effect-none'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{"hair":"hair-classic","outfit":"outfit-hoodie","accessory":"accessory-none","background":"background-desk","effect":"effect-none","color":"indigo"}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_reward_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher TEXT,
  subject TEXT,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  original_input TEXT,
  file_url TEXT,
  due_date TIMESTAMPTZ,
  estimated_minutes INT DEFAULT 60,
  difficulty INT DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
  grading_weight TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Assignment steps table
CREATE TABLE IF NOT EXISTS assignment_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  step_title TEXT NOT NULL,
  step_description TEXT,
  estimated_minutes INT DEFAULT 30,
  due_date TIMESTAMPTZ,
  order_index INT NOT NULL DEFAULT 0,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE assignment_steps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  minutes INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  quiz_type TEXT DEFAULT 'mixed' CHECK (quiz_type IN ('multiple_choice', 'short_answer', 'flashcards', 'mixed')),
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  question_type TEXT NOT NULL,
  answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  explanation TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS topic_tag TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS distractor_explanations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS recovery JSONB DEFAULT '{}'::jsonb;

-- Reward events table
CREATE TABLE IF NOT EXISTS reward_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  activity_type TEXT,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL;
ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Game sessions/results table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  game_type TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  points_awarded INT DEFAULT 0,
  player_score INT DEFAULT 0,
  opponent_score INT DEFAULT 0,
  difficulty TEXT,
  score INT DEFAULT 0,
  points_earned INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0;

-- Backward-compatible table used by the current app code.
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  game_type TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  points_awarded INT DEFAULT 0,
  player_score INT DEFAULT 0,
  opponent_score INT DEFAULT 0,
  difficulty TEXT,
  score INT DEFAULT 0,
  points_earned INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Missed questions table
CREATE TABLE IF NOT EXISTS missed_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  explanation TEXT,
  source_hint TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS topic_tag TEXT;
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS recovery_plan JSONB DEFAULT '{}'::jsonb;

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  default_quiz_difficulty TEXT DEFAULT 'medium',
  default_question_count INT DEFAULT 5,
  daily_study_goal_minutes INT DEFAULT 45,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Avatar item catalog and ownership
CREATE TABLE IF NOT EXISTS avatar_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  cost INT DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_avatar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_item_id TEXT NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, avatar_item_id)
);

-- Achievement catalog
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optional notes tables for richer generation later
CREATE TABLE IF NOT EXISTS assignment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE assignment_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

CREATE TABLE IF NOT EXISTS course_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE course_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Learning and review system tables
CREATE TABLE IF NOT EXISTS study_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  missed_question_id UUID REFERENCES missed_questions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'article',
  topic_tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  topic_tag TEXT NOT NULL,
  mastery_level TEXT NOT NULL DEFAULT 'Beginner' CHECK (mastery_level IN ('Beginner', 'Developing', 'Competent', 'Proficient', 'Mastered')),
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  correct_count INT NOT NULL DEFAULT 0,
  missed_count INT NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, course_id, assignment_id, topic_tag)
);

CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  topic_tag TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  source_type TEXT DEFAULT 'generated',
  is_favorite BOOLEAN DEFAULT FALSE,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  reason TEXT,
  estimated_minutes INT DEFAULT 25,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  display_name TEXT,
  provider_base_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'needs_setup' CHECK (status IN ('connected', 'needs_setup', 'sync_failed', 'disconnected')),
  sync_settings JSONB NOT NULL DEFAULT '{"enabled":false,"manual_approval":true,"frequency":"manual","future_only":true,"avoid_duplicates":true,"notify_new":true}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS external_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  teacher TEXT,
  subject TEXT,
  source_url TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS external_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  external_course_id UUID REFERENCES external_courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  description TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'imported', 'ignored', 'duplicate', 'updated')),
  duplicate_of_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'needs_setup')),
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  finished_at TIMESTAMPTZ,
  courses_found INT NOT NULL DEFAULT 0,
  assignments_found INT NOT NULL DEFAULT 0,
  assignments_imported INT NOT NULL DEFAULT 0,
  duplicates_found INT NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  source_label TEXT,
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'saved', 'partial', 'discarded')),
  total_candidates INT NOT NULL DEFAULT 0,
  saved_count INT NOT NULL DEFAULT 0,
  ignored_count INT NOT NULL DEFAULT 0,
  raw_input TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS import_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  external_assignment_id UUID REFERENCES external_assignments(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  course_name TEXT,
  due_date TIMESTAMPTZ,
  description TEXT,
  estimated_minutes INT NOT NULL DEFAULT 45,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'saved', 'ignored', 'duplicate')),
  duplicate_of_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO avatar_items (id, category, name, cost, rarity) VALUES
  ('hair-classic', 'hair', 'Classic', 0, 'common'),
  ('hair-waves', 'hair', 'Waves', 120, 'rare'),
  ('hair-neon', 'hair', 'Neon', 240, 'epic'),
  ('outfit-hoodie', 'outfit', 'Hoodie', 0, 'common'),
  ('outfit-varsity', 'outfit', 'Varsity', 180, 'rare'),
  ('outfit-armor', 'outfit', 'Quiz Armor', 360, 'epic'),
  ('accessory-none', 'accessory', 'None', 0, 'common'),
  ('accessory-glasses', 'accessory', 'Focus Glasses', 150, 'rare'),
  ('accessory-headset', 'accessory', 'Duel Headset', 300, 'epic'),
  ('background-desk', 'background', 'Study Desk', 0, 'common'),
  ('background-library', 'background', 'Library', 220, 'rare'),
  ('background-arena', 'background', 'Duel Arena', 420, 'epic'),
  ('effect-none', 'effect', 'None', 0, 'common'),
  ('effect-spark', 'effect', 'Spark', 260, 'epic'),
  ('effect-focus', 'effect', 'Focus Aura', 500, 'legendary')
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  rarity = EXCLUDED.rarity,
  updated_at = NOW();

INSERT INTO achievements (id, name, description, points_required) VALUES
  ('rookie-scholar', 'Rookie Scholar', 'Start your CramDeck journey.', 0),
  ('quiz-slayer', 'Quiz Slayer', 'Earn 300 points from quizzes and study.', 300),
  ('calendar-champion', 'Calendar Champion', 'Build a strong deadline habit.', 450),
  ('cramdeck-master', 'CramDeck Master', 'Reach 1200 total points.', 1200)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points_required = EXCLUDED.points_required,
  updated_at = NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_status_due ON assignments(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_steps_assignment_id ON assignment_steps(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started ON study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_created ON quiz_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_attempt_id ON quiz_questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_tag ON quiz_questions(topic_tag);
CREATE INDEX IF NOT EXISTS idx_reward_events_user_id ON reward_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_user_course_assignment ON reward_events(user_id, course_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_created ON game_results(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_results_user_course_assignment ON game_results(user_id, course_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_created ON game_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatar_items_user_id ON user_avatar_items(user_id);
CREATE INDEX IF NOT EXISTS idx_missed_questions_user_course_assignment ON missed_questions(user_id, course_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_missed_questions_user_topic ON missed_questions(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_assignment_notes_assignment_id ON assignment_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_course_notes_course_id ON course_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_study_resources_user_topic ON study_resources(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_topic ON topic_mastery(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_topic ON flashcards(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_status ON study_plans(user_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_provider ON connected_accounts(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_external_courses_user_provider ON external_courses(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_external_assignments_user_provider ON external_assignments(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_external_assignments_status ON external_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_user_provider_started ON sync_runs(user_id, provider, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_batches_user_status ON import_batches(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_candidates_batch_status ON import_candidates(import_batch_id, status);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, timezone, points, equipped_title, unlocked_titles, unlocked_cosmetics, avatar_config)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'America/New_York',
    0,
    'Rookie Scholar',
    ARRAY['Rookie Scholar'],
    ARRAY['hair-classic','outfit-hoodie','accessory-none','background-desk','effect-none'],
    '{"hair":"hair-classic","outfit":"outfit-hoodie","accessory":"accessory-none","background":"background-desk","effect":"effect-none","color":"indigo"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for mutable tables
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assignments_updated_at ON assignments;
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS assignment_steps_updated_at ON assignment_steps;
CREATE TRIGGER assignment_steps_updated_at BEFORE UPDATE ON assignment_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS study_sessions_updated_at ON study_sessions;
CREATE TRIGGER study_sessions_updated_at BEFORE UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS quiz_attempts_updated_at ON quiz_attempts;
CREATE TRIGGER quiz_attempts_updated_at BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS reward_events_updated_at ON reward_events;
CREATE TRIGGER reward_events_updated_at BEFORE UPDATE ON reward_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS game_sessions_updated_at ON game_sessions;
CREATE TRIGGER game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS game_results_updated_at ON game_results;
CREATE TRIGGER game_results_updated_at BEFORE UPDATE ON game_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS user_avatar_items_updated_at ON user_avatar_items;
CREATE TRIGGER user_avatar_items_updated_at BEFORE UPDATE ON user_avatar_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS assignment_notes_updated_at ON assignment_notes;
CREATE TRIGGER assignment_notes_updated_at BEFORE UPDATE ON assignment_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS course_notes_updated_at ON course_notes;
CREATE TRIGGER course_notes_updated_at BEFORE UPDATE ON course_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS study_resources_updated_at ON study_resources;
CREATE TRIGGER study_resources_updated_at BEFORE UPDATE ON study_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS topic_mastery_updated_at ON topic_mastery;
CREATE TRIGGER topic_mastery_updated_at BEFORE UPDATE ON topic_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS flashcards_updated_at ON flashcards;
CREATE TRIGGER flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS study_plans_updated_at ON study_plans;
CREATE TRIGGER study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER connected_accounts_updated_at BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS external_courses_updated_at ON external_courses;
CREATE TRIGGER external_courses_updated_at BEFORE UPDATE ON external_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS external_assignments_updated_at ON external_assignments;
CREATE TRIGGER external_assignments_updated_at BEFORE UPDATE ON external_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS sync_runs_updated_at ON sync_runs;
CREATE TRIGGER sync_runs_updated_at BEFORE UPDATE ON sync_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS import_batches_updated_at ON import_batches;
CREATE TRIGGER import_batches_updated_at BEFORE UPDATE ON import_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS import_candidates_updated_at ON import_candidates;
CREATE TRIGGER import_candidates_updated_at BEFORE UPDATE ON import_candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for assignment uploads (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false);

-- Enable RLS in the schema too. Detailed policies live in supabase/policies.sql.
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
