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
    <div className={currentView === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-auto'}>
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
