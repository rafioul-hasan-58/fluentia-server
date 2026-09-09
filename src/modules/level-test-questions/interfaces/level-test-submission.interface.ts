import {
  EnglishLevel,
  DifficultyType,
  TestQuestionSection,
  Prisma,
} from '@prisma/client';
import { LevelTestAnalysis } from '../../ai/schemas/level-test-analysis.schema';

export interface SectionMetric {
  correct: number;
  total: number;
  percentage: number;
}

export interface SectionBreakdownMetrics {
  grammar: SectionMetric;
  vocabulary: SectionMetric;
  reading: SectionMetric;
}

export interface GradedQuestionItem {
  questionId: string;
  number: number;
  question: string;
  passage?: string | null;
  sectionType: TestQuestionSection;
  level: EnglishLevel;
  difficulty: DifficultyType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
}

export interface LevelTestSubmitResult {
  attemptId: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  duration: string;
  sectionBreakdown: SectionBreakdownMetrics;
  analysis: LevelTestAnalysis;
  questions: GradedQuestionItem[];
}

export interface LearnerInfo {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  profileImage: string | null;
}

export interface SectionBreakdownSummary {
  grammar: {
    correct: number;
    total: number;
    percentage: number;
    formatted: string;
  };
  vocabulary: {
    correct: number;
    total: number;
    percentage: number;
    formatted: string;
  };
  reading: {
    correct: number;
    total: number;
    percentage: number;
    formatted: string;
  };
}

export interface SubmissionListItem {
  id: string;
  learner: LearnerInfo;
  cefrRating: EnglishLevel;
  score: {
    correct: number;
    total: number;
    percentage: number;
    formatted: string;
  };
  sectionBreakdown: SectionBreakdownSummary;
  duration: {
    timeSpentSeconds: number;
    formatted: string;
  };
  createdAt: Date;
}

export interface SubmissionListResult {
  items: SubmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TestAttemptUserRelation {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImage?: string | null;
}

export interface TestAttemptAnswerRelation {
  id?: string;
  questionId?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  question?: {
    sectionType?: TestQuestionSection | null;
    question?: string;
    passage?: string | null;
    level?: EnglishLevel | null;
    difficulty?: DifficultyType | null;
    answer?: string | null;
    explanation?: string | null;
    questionOptions?: Array<{
      id: string;
      content: string;
      isCorrect: boolean;
      questionId: string;
      createdAt?: Date;
    }>;
  } | null;
}

export interface RawSectionMetricItem {
  correct?: number;
  total?: number;
  percentage?: number;
  scoreText?: string;
}

export interface RawAiSectionItem {
  scoreText?: string;
  level?: string;
  analysis?: string;
}

export interface RawAiSectionBreakdown {
  grammar?: RawAiSectionItem;
  vocabulary?: RawAiSectionItem;
  reading?: RawAiSectionItem;
}

export interface RawAiAnalysisSummary {
  sectionBreakdown?: RawAiSectionBreakdown;
  estimatedLevel?: EnglishLevel;
  cefrScore?: number;
  summary?: string;
  strengths?: Array<{ area: string; description: string; evidence: string }>;
  weaknesses?: Array<{
    area: string;
    description: string;
    errorPattern: string;
    recommendation: string;
  }>;
  learningRoadmap?: Array<{
    step: number;
    title: string;
    focusArea: string;
    description: string;
    suggestedSkills: string[];
  }>;
}

export interface TestAttemptEntityInput {
  id: string;
  userId: string;
  score: number;
  totalQuestions?: number | null;
  percentage?: number | null;
  timeSpentSeconds?: number | null;
  duration?: string | null;
  estimatedLevel: EnglishLevel;
  createdAt: Date;
  updatedAt?: Date;
  sectionBreakdown?:
    Record<string, RawSectionMetricItem> | Prisma.JsonValue | null;
  aiAnalysis?:
    RawAiAnalysisSummary | LevelTestAnalysis | Prisma.JsonValue | null;
  user?: TestAttemptUserRelation | null;
  answers?: TestAttemptAnswerRelation[] | null;
}
