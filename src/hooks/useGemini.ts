import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

// Hardcoded configuration
const GEMINI_API_KEY = 'AIzaSyArOixZry2rNAvX4DGYceJFWWocfJcsZ0Y';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;

export const useGemini = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (
    messages: Message[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {

    setIsLoading(true);
    setError(null);

    try {
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system prompt as first message if provided
      if (systemPrompt) {
        contents.unshift({
          role: 'model',
          parts: [{ text: systemPrompt }]
        });
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Failed to generate response');
      }

      let fullResponse = '';
      const contentType = response.headers.get('content-type') || '';

      // Case 1: API returned JSON (array of chunk objects or single object)
      if (contentType.includes('application/json')) {
        const data = await response.json();

        const appendFromChunk = (chunkAny: any) => {
          try {
            const candidate = chunkAny?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            for (const part of parts) {
              if (typeof part?.text === 'string' && part.text.length > 0) {
                fullResponse += part.text;
                onChunk?.(part.text);
              }
            }
          } catch (_) {
            // ignore malformed chunk
          }
        };

        if (Array.isArray(data)) {
          for (const item of data) appendFromChunk(item);
        } else {
          appendFromChunk(data);
        }

        return fullResponse;
      }

      // Case 2: Streaming response (SSE-like with `data:` lines)
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let payload = trimmed;
          if (payload.startsWith('data: ')) payload = payload.slice(6);

          try {
            const data = JSON.parse(payload);
            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            for (const part of parts) {
              if (typeof part?.text === 'string' && part.text.length > 0) {
                fullResponse += part.text;
                onChunk?.(part.text);
              }
            }
          } catch {
            // Not a complete JSON object yet; continue accumulating
          }
        }
      }

      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateResponse,
    isLoading,
    error,
  };
};