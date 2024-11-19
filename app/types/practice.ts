export interface GeneratedProblem {
  title: string;
  difficulty: string;
  language: string;
  problem: string;
  startingCode?: string;
  solution: string;
  hints?: string[];
  testCases?: string[];
  type?: string;
  id: string;
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
    totalAttempts: number;
    problemsSolved: number;
    averageTime: number;
    streaks: number;
  };
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
  error?: string;
  message?: string;
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
