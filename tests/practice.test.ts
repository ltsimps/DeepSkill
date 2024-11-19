import { describe, it, expect, jest } from '@jest/globals';
import { loader, action } from '../app/routes/practice';
import { createRequest } from './test-utils';

// Mocking dependencies
jest.mock('../app/utils/auth.server', () => ({
  requireUserId: jest.fn(() => 'test-user-id'),
}));

jest.mock('../app/services/practice.server', () => ({
  practiceScheduler: {
    getNextProblem: jest.fn(() => ({
      type: 'PROBLEM_FOUND',
      problem: {
        id: '1',
        description: 'Test problem description',
        startingCode: '// Starting code',
        solution: 'solution',
        hints: JSON.stringify(['Hint 1', 'Hint 2']),
        testCases: JSON.stringify([]),
        type: 'FILL_IN',
        title: 'Test Problem',
        difficulty: 'EASY',
        language: 'javascript',
      },
    })),
  },
}));

jest.mock('../app/utils/openai.server', () => ({
  validateSolution: jest.fn(() => ({
    isCorrect: true,
    feedback: 'Correct solution!',
  })),
}));

// Test suite for practice route
describe('Practice Route', () => {
  it('should fetch a problem successfully', async () => {
    const request = createRequest('/practice', { method: 'GET' });
    const response = await loader({ request });
    const data = await response.json();

    expect(data.stats).toBeDefined();
  });

  it('should submit a solution and receive feedback', async () => {
    const formData = new URLSearchParams();
    formData.append('intent', 'validate');
    formData.append('code', 'solution');
    formData.append('solution', 'solution');
    formData.append('problemId', '1');
    formData.append('startTime', Date.now().toString());

    const request = createRequest('/practice', {
      method: 'POST',
      body: formData,
    });

    const response = await action({ request });
    const data = await response.json();

    expect(data.result.isCorrect).toBe(true);
    expect(data.result.feedback).toBe('Correct solution!');
  });
});
