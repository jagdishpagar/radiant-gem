import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 p-4"
    >
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="max-w-[80%]">
        <div className="bg-assistant-message text-assistant-message-foreground rounded-2xl px-4 py-3 shadow-message">
          <div className="flex items-center gap-1">
            <motion.div
              className="w-2 h-2 bg-muted-foreground rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-muted-foreground rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-muted-foreground rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};