import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { Settings } from './Settings';
import { useChatHistory } from '@/hooks/useChatHistory';

const Index = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  const { clearAllHistory } = useChatHistory();

  const handleOpenSettings = () => setCurrentView('settings');
  const handleBackToChat = () => setCurrentView('chat');

  return (
    <div className="h-screen overflow-hidden">
      {currentView === 'chat' ? (
        <ChatInterface onOpenSettings={handleOpenSettings} />
      ) : (
        <Settings 
          onBack={handleBackToChat} 
          onClearHistory={clearAllHistory}
        />
      )}
    </div>
  );
};

export default Index;
