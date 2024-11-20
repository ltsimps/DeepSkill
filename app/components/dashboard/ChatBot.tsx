import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useNavigate } from '@remix-run/react';
import { useUser } from '../../utils/user';

interface ChatBotProps {
  onLanguageSelect: (language: string) => void;
}

export function ChatBot({ onLanguageSelect }: ChatBotProps) {
  const navigate = useNavigate();
  const user = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      const languageMatch = message.content.match(/\b(javascript|python|typescript)\b/i);
      if (languageMatch) {
        onLanguageSelect(languageMatch[0].toLowerCase());
      }
    }
  });

  // Add initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: `Hello ${user.name || 'Engineer'}! What would you like to learn today? I can help you practice any programming concept.`
        }
      ]);
    }
  }, [setMessages, messages.length, user.name]);

  const handleStartPractice = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const languageMatch = lastMessage.content.match(/\b(javascript|python|typescript)\b/i);
      if (languageMatch) {
        navigate(`/practice?language=${languageMatch[0].toLowerCase()}`);
      } else {
        navigate('/practice');
      }
    }
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg border border-gray-700 transition-all duration-300 ${
      isExpanded ? 'h-[600px]' : 'h-[400px]'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white">Practice Assistant</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      <div className="flex flex-col h-[calc(100%-130px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center">
              <p>Loading...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'assistant'
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>

        <form 
          onSubmit={handleSubmit}
          className="border-t border-gray-700 p-4"
        >
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="What would you like to practice?"
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              Send
            </Button>
          </div>
          {messages.length > 1 && (
            <Button
              onClick={handleStartPractice}
              className="w-full mt-2 bg-green-500 hover:bg-green-600"
            >
              Start Practice Session
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
