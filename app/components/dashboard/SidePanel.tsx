import { Link, useLocation } from '@remix-run/react';
import { 
  LayoutDashboard, 
  Code2, 
  Trophy, 
  Settings, 
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { type SupportedLanguage } from '../../utils/language';
import { Avatar } from '../common/Avatar';
import { LanguageDropdown } from '../common/LanguageDropdown';
import { Button } from '../ui/button';
import { useState } from 'react';

interface SidePanelProps {
  className?: string;
  selectedLanguage: SupportedLanguage;
  onLanguageSelect: (language: SupportedLanguage) => void;
  userName?: string;
}

export function SidePanel({ 
  className, 
  selectedLanguage, 
  onLanguageSelect,
  userName = 'User'
}: SidePanelProps) {
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Code2, label: 'Practice', href: '/practice' },
    { icon: Trophy, label: 'Achievements', href: '/achievements' },
    { icon: BookOpen, label: 'Learning Paths', href: '/paths' },
    { icon: GraduationCap, label: 'My Progress', href: '/progress' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className={cn(
      "h-screen w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col",
      className
    )}>
      <div className="mb-8">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            DeepSkill
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <h3 className="text-gray-400 text-sm font-medium mb-2">Preferred Language</h3>
        <LanguageDropdown
          selectedLanguage={selectedLanguage}
          onLanguageSelect={(language) => setSelectedLanguage(language)}
          className="w-full"
        />
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50"
          asChild
        >
          <Link to="/profile">
            <Avatar
              name={userName}
              className="w-6 h-6 mr-2"
            />
            <span>{userName}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
