export type Profile = {
  id: string;
  full_name: string | null;
  school_name: string | null;
  grade_level: string | null;
  timezone: string | null;
  points: number;
  streak_count: number;
  equipped_title: string | null;
  unlocked_titles: string[] | null;
  unlocked_cosmetics: string[] | null;
  avatar_config: Record<string, unknown> | null;
  last_reward_date: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  user_id: string;
  name: string;
  teacher: string | null;
  subject: string | null;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

export type AssignmentStatus = "not_started" | "in_progress" | "completed" | "overdue";
export type AssignmentPriority = "low" | "medium" | "high" | "urgent";
export type SourceType = "paste" | "upload" | "manual" | "screenshot" | "pdf";

export type Assignment = {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  source_type: string;
  original_input: string | null;
  file_url: string | null;
  due_date: string | null;
  estimated_minutes: number;
  difficulty: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  grading_weight: string | null;
  requirements: string[] | null;
  ai_summary: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentStep = {
  id: string;
  assignment_id: string;
  step_title: string;
  step_description: string | null;
  estimated_minutes: number;
  due_date: string | null;
  order_index: number;
  is_done: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  assignment_id: string | null;
  type: string;
  message: string;
  scheduled_for: string | null;
  is_read: boolean;
  created_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  assignment_id: string | null;
  started_at: string;
  ended_at: string | null;
  minutes: number;
  notes: string | null;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  quiz_type: "multiple_choice" | "short_answer" | "flashcards" | "mixed";
  score: number;
  total_questions: number;
  points_earned: number;
  created_at: string;
};

export type QuizQuestionRow = {
  id: string;
  attempt_id: string;
  prompt: string;
  question_type: string;
  answer: string;
  user_answer: string | null;
  is_correct: boolean;
  explanation: string | null;
  topic_tag: string | null;
  difficulty: string | null;
  source: string | null;
  distractor_explanations: Record<string, unknown> | null;
  resources: Record<string, unknown>[] | null;
  recovery: Record<string, unknown> | null;
  order_index: number;
};

export type RewardEvent = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  activity_type: string | null;
  points: number;
  reason: string;
  source_type: string;
  source_id: string | null;
  created_at: string;
};

export type GameResult = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  game_type: string;
  opponent_name: string;
  result: "win" | "loss";
  points_awarded: number;
  player_score: number;
  opponent_score: number;
  duration_seconds: number;
  difficulty: string | null;
  score: number;
  points_earned: number;
  created_at: string;
};

export type MissedQuestion = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  quiz_attempt_id: string | null;
  question_text: string;
  correct_answer: string;
  user_answer: string | null;
  explanation: string | null;
  source_hint: string | null;
  topic_tag: string | null;
  resources: Record<string, unknown>[] | null;
  recovery_plan: Record<string, unknown> | null;
  is_reviewed: boolean;
  created_at: string;
};

export type AssignmentNote = {
  id: string;
  user_id: string;
  assignment_id: string;
  content: string;
  created_at: string;
};

export type CourseNote = {
  id: string;
  user_id: string;
  course_id: string;
  content: string;
  created_at: string;
};

export type StudyResource = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  quiz_attempt_id: string | null;
  missed_question_id: string | null;
  title: string;
  url: string;
  source_type: string;
  topic_tag: string;
  created_at: string;
};

export type TopicMastery = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  topic_tag: string;
  mastery_level: "Beginner" | "Developing" | "Competent" | "Proficient" | "Mastered";
  score: number;
  correct_count: number;
  missed_count: number;
  last_practiced_at: string | null;
  created_at: string;
};

export type Flashcard = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  topic_tag: string;
  front: string;
  back: string;
  source_type: string | null;
  is_favorite: boolean;
  last_reviewed_at: string | null;
  created_at: string;
};

export type StudyPlan = {
  id: string;
  user_id: string;
  course_id: string | null;
  assignment_id: string | null;
  title: string;
  reason: string | null;
  estimated_minutes: number;
  difficulty: string | null;
  status: "planned" | "in_progress" | "completed" | "skipped";
  scheduled_for: string | null;
  created_at: string;
};

export type AssignmentWithRelations = Assignment & {
  courses?: Course | null;
  assignment_steps?: AssignmentStep[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          school_name?: string | null;
          grade_level?: string | null;
          timezone?: string | null;
          points?: number;
          streak_count?: number;
          equipped_title?: string | null;
          unlocked_titles?: string[] | null;
          unlocked_cosmetics?: string[] | null;
          avatar_config?: Record<string, unknown> | null;
          last_reward_date?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          school_name?: string | null;
          grade_level?: string | null;
          timezone?: string | null;
          points?: number;
          streak_count?: number;
          equipped_title?: string | null;
          unlocked_titles?: string[] | null;
          unlocked_cosmetics?: string[] | null;
          avatar_config?: Record<string, unknown> | null;
          last_reward_date?: string | null;
        };
        Relationships: [];
      };
      courses: {
        Row: Course;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          teacher?: string | null;
          subject?: string | null;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          teacher?: string | null;
          subject?: string | null;
          description?: string | null;
          color?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          title: string;
          description?: string | null;
          notes?: string | null;
          source_type?: string;
          original_input?: string | null;
          file_url?: string | null;
          due_date?: string | null;
          estimated_minutes?: number;
          difficulty?: number;
          priority?: AssignmentPriority;
          status?: AssignmentStatus;
          grading_weight?: string | null;
          requirements?: string[] | null;
          ai_summary?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string | null;
          title?: string;
          description?: string | null;
          notes?: string | null;
          source_type?: string;
          original_input?: string | null;
          file_url?: string | null;
          due_date?: string | null;
          estimated_minutes?: number;
          difficulty?: number;
          priority?: AssignmentPriority;
          status?: AssignmentStatus;
          grading_weight?: string | null;
          requirements?: string[] | null;
          ai_summary?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      assignment_steps: {
        Row: AssignmentStep;
        Insert: {
          id?: string;
          assignment_id: string;
          step_title: string;
          step_description?: string | null;
          estimated_minutes?: number;
          due_date?: string | null;
          order_index?: number;
          is_done?: boolean;
          created_at?: string;
        };
        Update: {
          step_title?: string;
          step_description?: string | null;
          estimated_minutes?: number;
          due_date?: string | null;
          order_index?: number;
          is_done?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          id?: string;
          user_id: string;
          assignment_id?: string | null;
          type: string;
          message: string;
          scheduled_for?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
          message?: string;
          scheduled_for?: string | null;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: StudySession;
        Insert: {
          id?: string;
          user_id: string;
          assignment_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          minutes?: number;
          notes?: string | null;
        };
        Update: {
          ended_at?: string | null;
          minutes?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          topic: string;
          difficulty?: "easy" | "medium" | "hard";
          quiz_type?: "multiple_choice" | "short_answer" | "flashcards" | "mixed";
          score?: number;
          total_questions?: number;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          course_id?: string | null;
          assignment_id?: string | null;
          topic?: string;
          difficulty?: "easy" | "medium" | "hard";
          quiz_type?: "multiple_choice" | "short_answer" | "flashcards" | "mixed";
          score?: number;
          total_questions?: number;
          points_earned?: number;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: {
          id?: string;
          attempt_id: string;
          prompt: string;
          question_type: string;
          answer: string;
          user_answer?: string | null;
          is_correct?: boolean;
          explanation?: string | null;
          topic_tag?: string | null;
          difficulty?: string | null;
          source?: string | null;
          distractor_explanations?: Record<string, unknown> | null;
          resources?: Record<string, unknown>[] | null;
          recovery?: Record<string, unknown> | null;
          order_index?: number;
        };
        Update: {
          prompt?: string;
          question_type?: string;
          answer?: string;
          user_answer?: string | null;
          is_correct?: boolean;
          explanation?: string | null;
          topic_tag?: string | null;
          difficulty?: string | null;
          source?: string | null;
          distractor_explanations?: Record<string, unknown> | null;
          resources?: Record<string, unknown>[] | null;
          recovery?: Record<string, unknown> | null;
          order_index?: number;
        };
        Relationships: [];
      };
      reward_events: {
        Row: RewardEvent;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          activity_type?: string | null;
          points: number;
          reason: string;
          source_type: string;
          source_id?: string | null;
          created_at?: string;
        };
        Update: {
          course_id?: string | null;
          assignment_id?: string | null;
          activity_type?: string | null;
          points?: number;
          reason?: string;
          source_type?: string;
          source_id?: string | null;
        };
        Relationships: [];
      };
      game_results: {
        Row: GameResult;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          game_type: string;
          opponent_name: string;
          result: "win" | "loss";
          points_awarded?: number;
          player_score?: number;
          opponent_score?: number;
          duration_seconds?: number;
          difficulty?: string | null;
          score?: number;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          course_id?: string | null;
          assignment_id?: string | null;
          game_type?: string;
          opponent_name?: string;
          result?: "win" | "loss";
          points_awarded?: number;
          player_score?: number;
          opponent_score?: number;
          duration_seconds?: number;
          difficulty?: string | null;
          score?: number;
          points_earned?: number;
        };
        Relationships: [];
      };
      missed_questions: {
        Row: MissedQuestion;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          quiz_attempt_id?: string | null;
          question_text: string;
          correct_answer: string;
          user_answer?: string | null;
          explanation?: string | null;
          source_hint?: string | null;
          topic_tag?: string | null;
          resources?: Record<string, unknown>[] | null;
          recovery_plan?: Record<string, unknown> | null;
          is_reviewed?: boolean;
          created_at?: string;
        };
        Update: {
          course_id?: string | null;
          assignment_id?: string | null;
          quiz_attempt_id?: string | null;
          question_text?: string;
          correct_answer?: string;
          user_answer?: string | null;
          explanation?: string | null;
          source_hint?: string | null;
          topic_tag?: string | null;
          resources?: Record<string, unknown>[] | null;
          recovery_plan?: Record<string, unknown> | null;
          is_reviewed?: boolean;
        };
        Relationships: [];
      };
      assignment_notes: {
        Row: AssignmentNote;
        Insert: {
          id?: string;
          user_id: string;
          assignment_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      course_notes: {
        Row: CourseNote;
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      study_resources: {
        Row: StudyResource;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          quiz_attempt_id?: string | null;
          missed_question_id?: string | null;
          title: string;
          url: string;
          source_type?: string;
          topic_tag: string;
          created_at?: string;
        };
        Update: Partial<Omit<StudyResource, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      topic_mastery: {
        Row: TopicMastery;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          topic_tag: string;
          mastery_level?: TopicMastery["mastery_level"];
          score?: number;
          correct_count?: number;
          missed_count?: number;
          last_practiced_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<TopicMastery, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      flashcards: {
        Row: Flashcard;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          topic_tag: string;
          front: string;
          back: string;
          source_type?: string | null;
          is_favorite?: boolean;
          last_reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Flashcard, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      study_plans: {
        Row: StudyPlan;
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          assignment_id?: string | null;
          title: string;
          reason?: string | null;
          estimated_minutes?: number;
          difficulty?: string | null;
          status?: StudyPlan["status"];
          scheduled_for?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<StudyPlan, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
