import { addDays, subDays } from "date-fns";
import { PROFILE_DEFAULTS } from "@/lib/rewards";

export type DemoCourse = {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  color: string;
  progress: number;
};

export type DemoAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  estimatedMinutes: number;
  priority: "urgent" | "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
};

export type DemoQuiz = {
  id: string;
  title: string;
  courseId: string;
  score: number;
  questions: number;
  date: string;
};

export type DemoGame = {
  id: string;
  title: string;
  opponent: string;
  result: "win" | "loss";
  points: number;
};

export const demoCourses: DemoCourse[] = [
  { id: "biology", name: "Biology", teacher: "Ms. Chen", subject: "Science", color: "#22c55e", progress: 68 },
  { id: "algebra", name: "Algebra II", teacher: "Mr. Patel", subject: "Math", color: "#3b82f6", progress: 54 },
  { id: "english", name: "English", teacher: "Dr. Rivera", subject: "Language Arts", color: "#a855f7", progress: 76 },
  { id: "history", name: "U.S. History", teacher: "Mrs. Brooks", subject: "Social Studies", color: "#f97316", progress: 61 },
];

export const demoAssignments: DemoAssignment[] = [
  {
    id: "cell-membrane",
    courseId: "biology",
    title: "Cell Membrane Transport Review",
    description: "Compare diffusion, osmosis, facilitated diffusion, and active transport with examples.",
    dueDate: addDays(new Date(), 1).toISOString(),
    estimatedMinutes: 45,
    priority: "high",
    status: "in_progress",
  },
  {
    id: "quadratics",
    courseId: "algebra",
    title: "Quadratic Functions Practice",
    description: "Finish vertex form problems and explain how the graph shifts.",
    dueDate: addDays(new Date(), 2).toISOString(),
    estimatedMinutes: 60,
    priority: "high",
    status: "not_started",
  },
  {
    id: "rhetorical-analysis",
    courseId: "english",
    title: "Rhetorical Analysis Essay",
    description: "Draft the thesis, evidence paragraphs, and revision checklist for the speech analysis.",
    dueDate: addDays(new Date(), 4).toISOString(),
    estimatedMinutes: 95,
    priority: "urgent",
    status: "in_progress",
  },
  {
    id: "reconstruction",
    courseId: "history",
    title: "Reconstruction Era Notes",
    description: "Summarize the 13th, 14th, and 15th Amendments plus key Reconstruction debates.",
    dueDate: addDays(new Date(), 5).toISOString(),
    estimatedMinutes: 40,
    priority: "medium",
    status: "not_started",
  },
  {
    id: "enzyme-lab",
    courseId: "biology",
    title: "Enzyme Lab Graphs",
    description: "Graph reaction rate data and write a short conclusion about temperature effects.",
    dueDate: addDays(new Date(), 7).toISOString(),
    estimatedMinutes: 55,
    priority: "medium",
    status: "not_started",
  },
  {
    id: "systems-quiz",
    courseId: "algebra",
    title: "Systems of Equations Quiz Prep",
    description: "Review substitution, elimination, and word-problem setup before Friday's quiz.",
    dueDate: addDays(new Date(), 3).toISOString(),
    estimatedMinutes: 35,
    priority: "medium",
    status: "completed",
  },
  {
    id: "vocab",
    courseId: "english",
    title: "Unit 6 Vocabulary Cards",
    description: "Create flashcards with definition, synonym, antonym, and one original sentence.",
    dueDate: subDays(new Date(), 1).toISOString(),
    estimatedMinutes: 25,
    priority: "low",
    status: "completed",
  },
  {
    id: "industrialization",
    courseId: "history",
    title: "Industrialization Source Analysis",
    description: "Annotate two primary sources and identify author perspective, audience, and purpose.",
    dueDate: addDays(new Date(), 8).toISOString(),
    estimatedMinutes: 50,
    priority: "low",
    status: "not_started",
  },
];

export const demoQuizzes: DemoQuiz[] = [
  { id: "q1", title: "Cell Transport Check", courseId: "biology", score: 86, questions: 8, date: subDays(new Date(), 1).toISOString() },
  { id: "q2", title: "Quadratics Mixed Practice", courseId: "algebra", score: 74, questions: 10, date: subDays(new Date(), 2).toISOString() },
  { id: "q3", title: "Reconstruction Review", courseId: "history", score: 92, questions: 7, date: subDays(new Date(), 4).toISOString() },
];

export const demoGames: DemoGame[] = [
  { id: "g1", title: "Quiz Duel", opponent: "Byte Rival", result: "win", points: 80 },
  { id: "g2", title: "Flashcard Race", opponent: "Cardbot", result: "win", points: 65 },
  { id: "g3", title: "Boss Quiz", opponent: "The Deadline", result: "loss", points: 20 },
];

export const demoProfile = {
  id: "demo-user",
  full_name: "Maya Johnson",
  points: 740,
  streak_count: 6,
  equipped_title: "Homework Hunter",
  unlocked_titles: ["Rookie Scholar", "Flashcard Fighter", "Quiz Slayer", "Calendar Champion", "Homework Hunter"],
  unlocked_cosmetics: [
    ...PROFILE_DEFAULTS.unlocked_cosmetics,
    "hair-waves",
    "outfit-varsity",
    "accessory-glasses",
    "background-library",
    "effect-spark",
  ],
  avatar_config: {
    hair: "hair-waves",
    outfit: "outfit-varsity",
    accessory: "accessory-glasses",
    background: "background-library",
    effect: "effect-spark",
    color: "emerald",
  },
};

