import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Sparkles } from 'lucide-react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGemini, Message } from '@/hooks/useGemini';
import { useChatHistory } from '@/hooks/useChatHistory';

interface ChatInterfaceProps {
  onOpenSettings: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onOpenSettings }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { generateResponse, isLoading, error } = useGemini();
  const {
    chatHistory,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    addMessageToChat,
    deleteChat,
    getCurrentChat,
  } = useChatHistory();

  // Get system prompt from localStorage
  const getSystemPrompt = () => {
    return localStorage.getItem('system-prompt') || 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When providing code examples, use proper syntax highlighting and explain the code clearly.';
  };

  const currentChat = getCurrentChat();
  const systemPrompt = getSystemPrompt();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [currentChat?.messages, isTyping, currentResponse]);

  const handleSendMessage = async (content: string) => {

    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessageToChat(chatId, userMessage);

    // Generate AI response
    setIsTyping(true);
    setCurrentResponse('');
    
    try {
      const chat = getCurrentChat();
      const messages = chat ? [...chat.messages, userMessage] : [userMessage];
      
      const fullResponse = await generateResponse(
        messages,
        systemPrompt,
        (chunk) => {
          setCurrentResponse(prev => prev + chunk);
        }
      );

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };
      addMessageToChat(chatId, aiMessage);
      
    } catch (error) {
      console.error('Failed to generate response:', error);
    } finally {
      setIsTyping(false);
      setCurrentResponse('');
    }
  };

  const handleNewChat = () => {
    createNewChat();
    // Keep sidebar open on desktop, close on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // Keep sidebar open on desktop, close on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-primary">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Welcome to AI Assistant
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
        Start a conversation with your personal AI assistant powered by Google Gemini 2.0. 
        Ask questions, get help with coding, writing, or anything else you need.
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          Powered by Google Gemini 2.0 Flash
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen bg-gradient-background relative">
      <ChatSidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={deleteChat}
        onOpenSettings={onOpenSettings}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {currentChat && currentChat.messages.length > 0 ? (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 bg-chat-background">
              <div className="max-w-4xl mx-auto py-6">
                <AnimatePresence>
                  {currentChat.messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLatest={index === currentChat.messages.length - 1}
                    />
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && <TypingIndicator />}
                  
                  {/* Real-time Response */}
                  {currentResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="max-w-[80%]">
                        <div className="bg-assistant-message text-assistant-message-foreground rounded-2xl px-4 py-3 shadow-message">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {currentResponse}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2">
                <Alert variant="destructive" className="max-w-4xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>  
                </Alert>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <EmptyState />
          </div>
        )}

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={false}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};