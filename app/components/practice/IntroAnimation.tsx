import { useState, useEffect } from 'react';

export function IntroAnimation() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="relative w-96 h-96 mb-8" />;
  }

  return (
    <div className="relative w-96 h-96 mb-8">
      {/* Nebula core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 opacity-75 blur-xl animate-pulse" />
        <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60 blur-lg animate-pulse-slow" />
      </div>
      
      {/* Orbiting elements */}
      <div className="absolute inset-0">
        <div className="absolute w-8 h-8 rounded-full bg-blue-400 blur-sm animate-orbit" 
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg) translateX(150px)'}} />
        <div className="absolute w-6 h-6 rounded-full bg-purple-400 blur-sm animate-orbit-reverse"
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(120deg) translateX(120px)'}} />
        <div className="absolute w-4 h-4 rounded-full bg-pink-400 blur-sm animate-orbit-slow"
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(240deg) translateX(100px)'}} />
      </div>

      {/* Static stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => {
          const top = `${(i * 17) % 100}%`;
          const left = `${(i * 23) % 100}%`;
          const delay = `${(i * 0.3) % 2}s`;
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top,
                left,
                animationDelay: delay
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
