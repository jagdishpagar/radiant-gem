import { useState, useEffect, useCallback } from 'react';
import { ChatHistory, Message } from './useGemini';

const STORAGE_KEY = 'gemini-chat-history';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const history = parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChatHistory(history);
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const createNewChat = useCallback((): string => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
    };

    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    return newChatId;
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, title: title.slice(0, 50) }
          : chat
      )
    );
  }, []);

  const addMessageToChat = useCallback((chatId: string, message: Message) => {
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              timestamp: new Date(),
            }
          : chat
      )
    );

    // Auto-generate title from first user message
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat && chat.messages.length === 0 && message.role === 'user') {
      const title = message.content.slice(0, 50).trim();
      updateChatTitle(chatId, title);
    }
  }, [chatHistory, updateChatTitle]);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const clearAllHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentChatId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getCurrentChat = useCallback((): ChatHistory | null => {
    if (!currentChatId) return null;
    return chatHistory.find(chat => chat.id === currentChatId) || null;
  }, [currentChatId, chatHistory]);

  return {
    chatHistory,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    addMessageToChat,
    deleteChat,
    clearAllHistory,
    getCurrentChat,
    updateChatTitle,
  };
};