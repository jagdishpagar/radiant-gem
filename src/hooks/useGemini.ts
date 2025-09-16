import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const abortedRef = useRef(false);

  const stopStreaming = useCallback(() => {
    abortedRef.current = true;
  }, []);

  const generateResponse = useCallback(async (
    messages: Message[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    abortedRef.current = false;

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
      });

      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const fullContents = systemPrompt
        ? [{ role: 'user', parts: [{ text: systemPrompt }] }, ...contents]
        : contents;

      let fullResponse = '';

      const result = await model.generateContentStream({
        contents: fullContents as any,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      for await (const chunk of (result as any).stream) {
        if (abortedRef.current) {
          const err: any = new Error('Response stopped. Try again.');
          err.__aborted = true;
          throw err;
        }
        const chunkText = typeof chunk.text === 'function' ? chunk.text() : '';
        if (chunkText) {
          fullResponse += chunkText;
          onChunk?.(chunkText);
        }
      }

      // Optionally read the final response to ensure completion
      await (result as any).response;

      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      // Rethrow to allow UI to differentiate aborted vs real errors
      throw err as Error;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  return {
    generateResponse,
    isLoading,
    isStreaming,
    error,
    stopStreaming,
  };
};