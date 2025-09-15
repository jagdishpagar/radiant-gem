import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsProps {
  onBack: () => void;
  onClearHistory: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onClearHistory }) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const { toast } = useToast();

  // Load settings on mount
  useEffect(() => {
    const savedSystemPrompt = localStorage.getItem('system-prompt') || 
      'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When providing code examples, use proper syntax highlighting and explain the code clearly.';
    
    setSystemPrompt(savedSystemPrompt);
  }, []);

  const handleSave = () => {
    localStorage.setItem('system-prompt', systemPrompt);
    
    toast({
      title: "Settings saved",
      description: "Your system prompt has been updated successfully.",
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


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-screen bg-gradient-background"
    >
      <ScrollArea className="h-full">
        <div className="max-w-2xl mx-auto p-4">
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
          {/* AI Model Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Model Information
              </CardTitle>
              <CardDescription>
                Your AI assistant is powered by Google Gemini 2.0 Flash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  This assistant uses <strong>Google Gemini 2.0 Flash</strong> model for fast, intelligent responses. 
                  The API key is preconfigured and ready to use.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Model Capabilities:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Advanced reasoning and problem-solving</li>
                  <li>• Code generation and debugging</li>
                  <li>• Multi-language support</li>
                  <li>• Real-time streaming responses</li>
                </ul>
              </div>
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
      </ScrollArea>
    </motion.div>
  );
};