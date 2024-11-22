import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeProblem } from './PracticeProblem';
import { PracticeProvider } from '../../contexts/PracticeContext';

// Mock Monaco editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language }: any) => (
    <textarea
      data-testid="mock-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-language={language}
    />
  )
}));

describe('PracticeProblem', () => {
  const mockState = {
    currentProblem: {
      id: '123',
      title: 'Test Problem',
      description: 'Test description',
      difficulty: 'EASY',
      hints: ['Hint 1', 'Example test case: input: [1,2,3], output: 6'],
      language: 'python',
      solution: '',
      testCases: [],
      startingCode: ''
    },
    feedback: null,
    isSubmitting: false,
    showHints: true,
    timeSpent: 0
  };

  const mockDispatch = vi.fn();

  const mockProps = {
    onSubmit: vi.fn(),
    onSkip: vi.fn()
  };

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <PracticeProvider initialState={mockState} dispatch={mockDispatch}>
        {ui}
      </PracticeProvider>
    );
  };

  it('renders problem title and description', () => {
    renderWithProvider(<PracticeProblem {...mockProps} />);
    
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays hints when show hints is clicked', () => {
    renderWithProvider(<PracticeProblem {...mockProps} />);
    
    const showHintsButton = screen.getByText('Show Hints');
    fireEvent.click(showHintsButton);
    
    expect(screen.getByText('Hint 1')).toBeInTheDocument();
    expect(screen.getByText('Example test case: input: [1,2,3], output: 6')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', () => {
    renderWithProvider(<PracticeProblem {...mockProps} />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    expect(mockProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onSkip when skip button is clicked', () => {
    renderWithProvider(<PracticeProblem {...mockProps} />);
    
    const skipButton = screen.getByText('Skip');
    fireEvent.click(skipButton);
    
    expect(mockProps.onSkip).toHaveBeenCalled();
  });

  it('uses Python as the programming language for code editor', () => {
    renderWithProvider(<PracticeProblem {...mockProps} />);
    
    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveAttribute('data-language', 'python');
  });

  it('defaults to Python when no language is specified', () => {
    const stateWithoutLanguage = {
      ...mockState,
      currentProblem: { ...mockState.currentProblem, language: undefined }
    };
    
    render(
      <PracticeProvider initialState={stateWithoutLanguage} dispatch={mockDispatch}>
        <PracticeProblem {...mockProps} />
      </PracticeProvider>
    );
    
    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveAttribute('data-language', 'python');
  });
});
