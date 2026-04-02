import { useState, useEffect, useCallback } from 'react';
import { ChatHistory, Message } from './useOpenAI';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load chat list from server
  const fetchChats = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        // Data from server is list of {id, title, timestamp}. 
        // We need to initialize messages as empty array for list view if not provided, 
        // or we might need to fetch details when selecting.
        // For now, let's assume the list endpoint returns metadata and we fetch details on select.
        // But the UI expects `ChatHistory[]` which includes messages.
        // To be efficient, we might want to lazy load messages.
        // However, the current UI likely expects `messages` to be present.
        // Let's modify the flow: 
        // 1. `chatHistory` state will hold the list of chats (metadata + maybe messages if loaded).
        // 2. When selecting a chat, we ensure messages are loaded.

        // For simplicity and to match current behavior, we'll map the server response
        // and assume messages are empty until loaded, OR we could fetch all (heavy).
        // Let's stick to: Load list. If currentChatId is set, load that chat's details.

        const history = data.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: [] // Initial empty messages
        }));
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch specific chat details when currentChatId changes
  useEffect(() => {
    if (!currentChatId) return;

    const fetchChatDetails = async () => {
      try {
        const res = await fetch(`/api/history/${currentChatId}`);
        if (res.ok) {
          const fullChat = await res.json();
          setChatHistory(prev => prev.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                timestamp: new Date(fullChat.timestamp),
                messages: fullChat.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
              };
            }
            return chat;
          }));
        }
      } catch (error) {
        console.error(`Failed to fetch chat ${currentChatId}:`, error);
      }
    };

    fetchChatDetails();
  }, [currentChatId]);


  const createNewChat = useCallback((): string => {
    const newChatId = Date.now().toString();
    // We don't create on server yet, only when first message is sent?
    // Or we can create a placeholder locally.
    // The previous implementation created it locally. 

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

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    // Optimistic update
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, title: title.slice(0, 50) }
          : chat
      )
    );
    // Server doesn't have a specific "update title" endpoint derived in plan, 
    // but POST /api/history/:chatId handles title update if provided in body.
    // We can send a dummy message or just rely on the next message to update it?
    // actually POST updates title if provided. 
    // We might want a specific endpoint or just ignore explicit title updates for now 
    // since the server auto-updates title on first message.
    // Let's leave it as local for now, it will be synced when sending message if we send title.
  }, []);

  const addMessageToChat = useCallback(async (chatId: string, message: Message) => {
    // Optimistic update
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
            ...chat,
            messages: [...(chat.messages || []), message],
            timestamp: new Date(),
          }
          : chat
      )
    );

    // Auto-generate title logic (client side mostly)
    let titleToUpdate: string | undefined;
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat && chat.messages.length === 0 && message.role === 'user') {
      titleToUpdate = message.content.slice(0, 50).trim();
      // Optimistically update title
      setChatHistory(prev =>
        prev.map(c =>
          c.id === chatId
            ? { ...c, title: titleToUpdate! }
            : c
        )
      );
    }

    // Persist to server
    try {
      await fetch(`/api/history/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          title: titleToUpdate
        })
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }

  }, [chatHistory]);

  const deleteChat = useCallback(async (chatId: string) => {
    // Optimistic update
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }

    try {
      await fetch(`/api/history/${chatId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [currentChatId]);

  const clearAllHistory = useCallback(async () => {
    setChatHistory([]);
    setCurrentChatId(null);
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
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
    isLoadingHistory
  };
};