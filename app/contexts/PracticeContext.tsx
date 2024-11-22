import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { GeneratedProblem, ProblemFeedback } from '../types/practice';

type PracticeSessionState = {
  sessionId: string | null;
  currentProblem: GeneratedProblem | null;
  feedback: ProblemFeedback | null;
  problemsAttempted: number;
  skippedProblems: number;
  totalPoints: number;
  sessionStartTime: number;
  problemTimes: number[];
  isSessionComplete: boolean;
  isLoading: boolean;
  error: Error | null;
  lastAction: string | null;
  analysis: {
    startingXp: number;
    finalXp: number;
    level: number;
  } | null;
  newAchievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    xpReward: number;
  }>;
  totalProblems: number;
  remainingProblems: number;
  selectedLanguage: string;
};

type PracticeAction = 
  | { type: 'START_SESSION' }
  | { type: 'SET_SESSION'; session: any }
  | { type: 'SET_PROBLEM'; problem: GeneratedProblem }
  | { type: 'SET_FEEDBACK'; feedback: ProblemFeedback; newAchievements?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    xpReward: number;
  }> }
  | { type: 'SKIP_PROBLEM' }
  | { type: 'COMPLETE_PROBLEM'; timeSpent: number; points: number }
  | { type: 'END_SESSION' }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_LAST_ACTION'; action: string }
  | { type: 'SET_LANGUAGE'; language: string };

const initialState: PracticeSessionState = {
  sessionId: null,
  currentProblem: null,
  feedback: null,
  problemsAttempted: 0,
  skippedProblems: 0,
  totalPoints: 0,
  sessionStartTime: Date.now(),
  problemTimes: [],
  isSessionComplete: false,
  isLoading: false,
  error: null,
  lastAction: null,
  analysis: null,
  newAchievements: [],
  totalProblems: 0,
  remainingProblems: 0,
  selectedLanguage: 'python'
};

const MIN_PROBLEMS_REQUIRED = 3;
const MAX_SKIP_PERCENTAGE = 0.7;  // 70% max skip rate

function practiceReducer(state: PracticeSessionState, action: PracticeAction): PracticeSessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        isLoading: true
      };
    case 'SET_SESSION': {
      const firstProblem = action.session.problems[0]?.problem;
      return {
        ...state,
        sessionId: action.session.id,
        currentProblem: firstProblem,
        problemsAttempted: 0,
        skippedProblems: 0,
        totalPoints: 0,
        sessionStartTime: Date.now(),
        problemTimes: [],
        isSessionComplete: false,
        isLoading: false,
        error: null,
        lastAction: 'SET_SESSION'
      };
    }
    case 'SET_PROBLEM':
      return {
        ...state,
        currentProblem: action.problem,
        feedback: null,
        isLoading: false,
        error: null,
        lastAction: 'SET_PROBLEM',
      };
    
    case 'SET_FEEDBACK':
      return {
        ...state,
        feedback: action.feedback,
        newAchievements: action.newAchievements || [],
        remainingProblems: Math.max(0, state.remainingProblems - 1),
        lastAction: 'SET_FEEDBACK',
      };
    
    case 'SKIP_PROBLEM':
      const newSkipCount = state.skippedProblems + 1;
      const newTotalCount = state.problemsAttempted + 1;
      const skipRate = newSkipCount / newTotalCount;

      // Check if we've hit max skip rate and minimum problems
      const isSessionInvalid = 
        (newTotalCount >= MIN_PROBLEMS_REQUIRED && skipRate > MAX_SKIP_PERCENTAGE) ||
        (newSkipCount === MIN_PROBLEMS_REQUIRED);

      return {
        ...state,
        skippedProblems: newSkipCount,
        problemsAttempted: newTotalCount,
        totalPoints: state.totalPoints - 50,
        isLoading: !isSessionInvalid,
        isSessionComplete: isSessionInvalid,
        remainingProblems: Math.max(0, state.remainingProblems - 1),
        lastAction: 'SKIP_PROBLEM',
        error: isSessionInvalid ? new Error(
          `Session ended: Too many problems skipped. Try to solve at least ${Math.ceil((1 - MAX_SKIP_PERCENTAGE) * 100)}% of problems.`
        ) : null
      };
    
    case 'COMPLETE_PROBLEM':
      return {
        ...state,
        problemsAttempted: state.problemsAttempted + 1,
        totalPoints: state.totalPoints + action.points,
        problemTimes: [...state.problemTimes, action.timeSpent],
        isLoading: true,
        remainingProblems: Math.max(0, state.remainingProblems - 1),
        lastAction: 'COMPLETE_PROBLEM',
      };
    
    case 'END_SESSION':
      return {
        ...state,
        isSessionComplete: true,
        currentProblem: null,
        feedback: null,
        isLoading: false,
        lastAction: 'END_SESSION',
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
        lastAction: 'SET_ERROR',
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        lastAction: 'CLEAR_ERROR',
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
        lastAction: 'SET_LOADING',
      };
    
    case 'SET_LAST_ACTION':
      return {
        ...state,
        lastAction: action.action,
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        selectedLanguage: action.language,
        lastAction: 'SET_LANGUAGE',
      };
    
    default:
      return state;
  }
}

const PracticeContext = createContext<{
  state: PracticeSessionState;
  dispatch: React.Dispatch<PracticeAction>;
} | null>(null);

export function PracticeProvider({ 
  children,
  loaderData
}: { 
  children: ReactNode;
  loaderData?: any;
}) {
  const [state, dispatch] = useReducer(practiceReducer, {
    ...initialState,
    ...(loaderData?.session && {
      sessionId: loaderData.session.id,
      currentProblem: loaderData.session.currentProblem,
      problemsAttempted: loaderData.session.problemsAttempted,
      skippedProblems: loaderData.session.skippedProblems,
      totalPoints: loaderData.session.totalPoints,
      sessionStartTime: new Date(loaderData.session.createdAt).getTime(),
      selectedLanguage: loaderData.selectedLanguage
    })
  });

  return (
    <PracticeContext.Provider value={{ state, dispatch }}>
      {children}
    </PracticeContext.Provider>
  );
}

export function usePracticeSession() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePracticeSession must be used within a PracticeProvider');
  }
  return context;
}

export function getSessionStats(state: PracticeSessionState) {
  const averageTime = state.problemTimes.length > 0
    ? state.problemTimes.reduce((a, b) => a + b, 0) / state.problemTimes.length
    : 0;

  return {
    totalProblems: state.problemsAttempted,
    problemsSolved: state.problemsAttempted - state.skippedProblems,
    skippedProblems: state.skippedProblems,
    totalPoints: state.totalPoints,
    averageTime,
  };
}
