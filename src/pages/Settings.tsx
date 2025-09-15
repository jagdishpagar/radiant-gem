import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Key, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface SettingsProps {
  onBack: () => void;
  onClearHistory: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onClearHistory }) => {
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  // Load settings on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key') || '';
    const savedSystemPrompt = localStorage.getItem('system-prompt') || 
      'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When providing code examples, use proper syntax highlighting and explain the code clearly.';
    
    setApiKey(savedApiKey);
    setSystemPrompt(savedSystemPrompt);
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('system-prompt', systemPrompt);
    
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  const handleClearHistory = () => {
    onClearHistory();
    toast({
      title: "History cleared",
      description: "All chat history has been removed.",
      variant: "destructive",
    });
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-background p-4"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure your AI assistant</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure your Google Gemini API key to enable AI responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                {apiKey && (
                  <p className="text-xs text-muted-foreground">
                    Current key: {maskApiKey(apiKey)}
                  </p>
                )}
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Get your API key from the{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                  . Your key is stored locally and never sent to our servers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                System Prompt
              </CardTitle>
              <CardDescription>
                Customize how the AI assistant behaves and responds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="system-prompt">Assistant Instructions</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful AI assistant..."
                  className="min-h-[120px] resize-none"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines the AI's personality and behavior. Be specific about the tone, style, and expertise you want.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your chat history and stored data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleClearHistory}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Chat History
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete all your conversations. This action cannot be undone.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-white shadow-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};