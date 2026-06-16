-- EagleCram Learning & Review Upgrade
-- Run this in Supabase SQL Editor if your base EagleCram schema already exists.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS topic_tag TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS distractor_explanations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS recovery JSONB DEFAULT '{}'::jsonb;

ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS topic_tag TEXT;
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE missed_questions ADD COLUMN IF NOT EXISTS recovery_plan JSONB DEFAULT '{}'::jsonb;

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

CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_tag ON quiz_questions(topic_tag);
CREATE INDEX IF NOT EXISTS idx_missed_questions_user_topic ON missed_questions(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_study_resources_user_topic ON study_resources(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_topic ON topic_mastery(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_topic ON flashcards(user_id, topic_tag);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_status ON study_plans(user_id, status, scheduled_for);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS study_resources_updated_at ON study_resources;
CREATE TRIGGER study_resources_updated_at BEFORE UPDATE ON study_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS topic_mastery_updated_at ON topic_mastery;
CREATE TRIGGER topic_mastery_updated_at BEFORE UPDATE ON topic_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS flashcards_updated_at ON flashcards;
CREATE TRIGGER flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS study_plans_updated_at ON study_plans;
CREATE TRIGGER study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view own study resources" ON study_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study resources" ON study_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study resources" ON study_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study resources" ON study_resources FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own topic mastery" ON topic_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topic mastery" ON topic_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topic mastery" ON topic_mastery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topic mastery" ON topic_mastery FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON flashcards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study plans" ON study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plans" ON study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study plans" ON study_plans FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
