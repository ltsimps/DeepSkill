import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from './practice';
import { prisma } from '../utils/db.server';
import { validateSolution, generateAnalysis } from '../utils/openai.server';
import { checkAndAwardAchievements } from '../utils/achievements.server';

// Mock dependencies
vi.mock('../utils/db.server', () => ({
  prisma: {
    problem: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    problemProgression: {
      upsert: vi.fn(),
      update: vi.fn()
    },
    sessionProblem: {
      findMany: vi.fn(),
      update: vi.fn()
    },
    practiceSession: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn()
    },
    user: {
      update: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../utils/openai.server', () => ({
  validateSolution: vi.fn(),
  generateAnalysis: vi.fn(),
  generateProblem: vi.fn()
}));

vi.mock('../utils/achievements.server', () => ({
  checkAndAwardAchievements: vi.fn()
}));

describe('Practice Route Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Solution Submission', () => {
    it('should store solution without validation during practice', async () => {
      // Setup
      const formData = new FormData();
      formData.append('intent', 'submitSolution');
      formData.append('problemId', '123');
      formData.append('sessionId', '456');
      formData.append('solution', 'test solution');
      formData.append('language', 'python');
      formData.append('startTime', Date.now().toString());
      formData.append('isSessionComplete', 'false');

      const request = new Request('http://test.com', {
        method: 'POST',
        body: formData
      });

      // Mock database responses
      prisma.problem.findUnique.mockResolvedValue({
        id: '123',
        language: 'python'
      });

      prisma.sessionProblem.update.mockResolvedValue({
        id: '789',
        problemId: '123',
        sessionId: '456'
      });

      // Execute
      const response = await action({ request } as any);
      const data = await response.json();

      // Verify
      expect(validateSolution).not.toHaveBeenCalled();
      expect(generateAnalysis).not.toHaveBeenCalled();
      expect(data.success).toBe(true);
      expect(data.feedback).toBeNull();
      expect(data.xp).toBe(0);
    });

    it('should validate all solutions and award XP on session completion', async () => {
      // Setup
      const formData = new FormData();
      formData.append('intent', 'submitSolution');
      formData.append('problemId', '123');
      formData.append('sessionId', '456');
      formData.append('solution', 'test solution');
      formData.append('language', 'python');
      formData.append('startTime', Date.now().toString());
      formData.append('isSessionComplete', 'true');

      const request = new Request('http://test.com', {
        method: 'POST',
        body: formData
      });

      // Mock database responses
      prisma.problem.findUnique.mockResolvedValue({
        id: '123',
        language: 'python',
        difficulty: 'EASY'
      });

      prisma.sessionProblem.findMany.mockResolvedValue([
        {
          problemId: '123',
          problem: { 
            language: 'python', 
            solution: 'correct solution',
            difficulty: 'EASY'
          },
          progression: { 
            lastSolution: 'test solution', 
            timeSpent: 5000 
          }
        }
      ]);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user123',
        xp: 100,
        level: 1
      });

      validateSolution.mockResolvedValue(true);
      generateAnalysis.mockResolvedValue('Good job!');

      // Execute
      const response = await action({ request } as any);
      const data = await response.json();

      // Verify
      expect(validateSolution).toHaveBeenCalled();
      expect(generateAnalysis).toHaveBeenCalled();
      expect(data.success).toBe(true);
      expect(data.analyses).toBeDefined();
      expect(checkAndAwardAchievements).toHaveBeenCalled();
    });
  });

  describe('Language Selection', () => {
    it('should use the correct language when starting a new session', async () => {
      // Setup
      const formData = new FormData();
      formData.append('intent', 'startSession');
      formData.append('language', 'python');

      const request = new Request('http://test.com', {
        method: 'POST',
        body: formData
      });

      prisma.user.findUnique.mockResolvedValue({ 
        id: 'user123',
        rating: 1000 
      });

      prisma.practiceSession.create.mockResolvedValue({
        id: '789',
        problems: []
      });

      // Execute
      const response = await action({ request } as any);
      const data = await response.json();

      // Verify
      expect(prisma.practiceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            problems: expect.any(Object)
          })
        })
      );
      expect(data.success).toBe(true);
    });
  });
});
