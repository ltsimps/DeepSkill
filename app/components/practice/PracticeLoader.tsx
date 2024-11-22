import { motion } from 'framer-motion';

export function PracticeLoader() {
  const messages = [
    "Loading your practice session...",
    "Preparing coding challenges...",
    "Setting up your workspace...",
    "Almost ready..."
  ];

  return (
    <div className="h-full w-full bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          {/* Code Editor Animation */}
          <div className="mb-8">
            <motion.div
              className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Typing Animation */}
              <motion.div
                className="h-1 bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
              
              {/* Code Lines Animation */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-4 bg-gray-700/50 mx-4 my-2 rounded"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "100%", "60%"] }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Loading Messages */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 1.5,
                  repeat: 1,
                  repeatType: "reverse",
                  repeatDelay: 1
                }}
                className="text-center text-gray-300"
              >
                {message}
              </motion.div>
            ))}
          </div>

          {/* Loading Progress */}
          <motion.div
            className="mt-8 h-1 bg-gray-700 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
