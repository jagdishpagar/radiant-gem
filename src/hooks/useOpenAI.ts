import { useState, useCallback, useRef } from 'react';

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

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || process.env.VITE_OPENAI_MODEL || 'gpt-4o';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/** Stream OpenAI chat completion and call onChunk for each content delta */
async function streamOpenAI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  signal: AbortSignal | undefined,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      stream: true,
      max_tokens: 8192,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const data = JSON.parse(raw) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      } catch {
        // skip malformed chunk
      }
    }
  }
  return fullResponse;
}

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortedRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  const generateResponse = useCallback(
    async (
      messages: Message[],
      systemPrompt: string,
      onChunk?: (chunk: string) => void,
      _useGoogleSearch?: boolean
    ): Promise<string> => {
      setIsLoading(true);
      setIsStreaming(true);
      setError(null);
      abortedRef.current = false;
      abortControllerRef.current = null;

      const openAIMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))]
        : messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const checkAbort = () => {
          if (abortedRef.current) {
            const err: Error & { __aborted?: boolean } = new Error('Response stopped. Try again.');
            err.__aborted = true;
            throw err;
          }
        };

        const fullResponse = await streamOpenAI(
          openAIMessages,
          controller.signal,
          (text) => {
            checkAbort();
            onChunk?.(text);
          }
        );
        return fullResponse;
      } catch (err) {
        const isAborted =
          (err as Error & { name?: string }).name === 'AbortError' ||
          (err as Error & { __aborted?: boolean }).__aborted;
        if (isAborted) {
          const abortedErr: Error & { __aborted?: boolean } = new Error('Response stopped. Try again.');
          abortedErr.__aborted = true;
          throw abortedErr;
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err as Error;
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    []
  );

  return {
    generateResponse,
    isLoading,
    isStreaming,
    error,
    stopStreaming,
  };
};
