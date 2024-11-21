export type ProgrammingLanguage = 'javascript' | 'python' | 'typescript' | 'java' | 'cpp';

export interface GeneratedProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: ProgrammingLanguage;
  problem: string;
  startingCode?: string;
  solution: string;
  hints: string; // JSON string of hints array
  testCases: string; // JSON string of test cases array
  type?: string;
}

export interface ProblemProgression {
  userId: string;
  problemId: string;
  attempts: number;
  solved: boolean;
  timeSpent: number;
  consecutiveCorrect: number;
  lastAttempt: Date;
  problem: {
    description: string;
    startingCode: string;
    solution: string;
    type: string;
    title: string;
    difficulty: string;
    id: string;
  };
}

export interface LoaderData {
  stats: {
    level: number;
    streak: number;
    totalXp: number;
    lastPractice: Date | null;
    preferredLanguage: ProgrammingLanguage;
  };
  activeSession: any;
}

export interface FetcherData {
  problem?: GeneratedProblem;
  result?: {
    isCorrect: boolean;
    feedback: string;
  };
  xpGained?: number;
  nextProblem?: GeneratedProblem | null;
  dailyLimitReached?: boolean;
}

export interface ProblemFeedback {
  isCorrect?: boolean;
  message?: string;
}

export interface PracticeInterfaceProps {
  problem: {
    problem: string;
    startingCode?: string;
    hints?: string[];
    type: string;
    title: string;
    difficulty: string;
    id: string;
  };
  onSubmit: (code: string) => void;
  feedback?: ProblemFeedback;
}
