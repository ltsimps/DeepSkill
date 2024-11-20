import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProblemTransitionProps {
  children: React.ReactNode;
  problemId: string;
}

export function ProblemTransition({ children, problemId }: ProblemTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [problemId]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={problemId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
