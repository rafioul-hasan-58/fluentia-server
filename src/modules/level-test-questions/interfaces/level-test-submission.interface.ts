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
  sectionBreakdown: SectionBreakdownMetrics;
  analysis: LevelTestAnalysis;
  questions: GradedQuestionItem[];
}
