import { Button } from '../../components/ui/button';
import { IntroAnimation } from './IntroAnimation';

interface PracticeDashboardProps {
  onStart: () => void;
  onLanguageChange: (language: string) => void;
  selectedLanguage: string;
}

export function PracticeDashboard({ onStart, onLanguageChange, selectedLanguage }: PracticeDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <IntroAnimation />
      <div className="flex flex-col items-center gap-4">
        <select 
          value={selectedLanguage} 
          onChange={(e) => onLanguageChange(e.target.value)}
          className="mb-4 p-2 rounded-md bg-gray-800 text-white border border-gray-700"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 text-lg hover:opacity-90 transition-opacity"
        >
          Begin Practice
        </Button>
      </div>
    </div>
  );
}
