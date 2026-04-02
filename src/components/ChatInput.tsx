import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Square, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onStop?: () => void;
  /** When true, uses Google Grounding Search for real-time/live data */
  liveMode?: boolean;
  onLiveModeChange?: (enabled: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isLoading = false,
  onStop,
  liveMode = false,
  onLiveModeChange,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-t border-border bg-background/80 backdrop-blur-sm p-4"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={liveMode ? 'default' : 'outline'}
                  size="sm"
                  className={`h-11 px-3 shadow-soft shrink-0 ${liveMode ? 'gradient-primary text-white shadow-primary' : ''}`}
                  onClick={() => onLiveModeChange?.(!liveMode)}
                  disabled={disabled || isLoading}
                >
                  <Radio className="h-4 w-4 mr-1.5" />
                  Live
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                {liveMode
                  ? 'Google Search is on — answers use real-time web data'
                  : 'Turn on to get answers using real-time Google Search'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={disabled}
              className="min-h-[44px] max-h-[200px] resize-none pr-12 shadow-soft border-border/50 focus:border-primary/50"
              rows={1}
            />
          </div>
          
          {isLoading ? (
            <Button
              type="button"
              onClick={onStop}
              variant="destructive"
              size="sm"
              className="h-11 px-4 shadow-soft"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              className="h-11 px-4 gradient-primary text-white shadow-primary disabled:opacity-50 disabled:shadow-none"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-1 h-1 bg-primary rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1 h-1 bg-primary rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-1 bg-primary rounded-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
              AI is thinking...
            </span>
          ) : (
            <span>
              {liveMode && <span className="text-primary font-medium">Live search on · </span>}
              Press Enter to send, Shift+Enter for new line
            </span>
          )}
        </div>
      </form>
    </motion.div>
  );
};