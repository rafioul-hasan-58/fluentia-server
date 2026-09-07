import {
  EnglishLevel,
  DifficultyType,
  TestQuestionSection,
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
