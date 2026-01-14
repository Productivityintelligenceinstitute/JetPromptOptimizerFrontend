import { Message } from '@/shared/types/chat';
import { formatMessage } from '@/shared/utils/messageFormatter';
import { logError } from '@/shared/utils/errorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getWebSocketBaseUrl() {
  if (!API_BASE_URL) return '';
  if (API_BASE_URL.startsWith('https')) {
    return API_BASE_URL.replace('https', 'wss');
  }
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.replace('http', 'ws');
  }
  return `ws://${API_BASE_URL.replace(/^\/+/, '')}`;
}

export type OptimizationLevelKey = 'basic' | 'structured' | 'mastery' | 'system';

export interface OptimizationSocketCallbacks {
  onToken?: (partialText: string) => void;
  onCompleted?: (chatId: string, messageId?: string) => void;
  onError?: (message: string) => void;
  onCancelled?: () => void;
  onFinalText?: (finalText: string) => void;
}

export interface OptimizationSocketOptions {
  level: OptimizationLevelKey;
  userId: string;
  chatId?: string | null;
  userPrompt: string;
  callbacks: OptimizationSocketCallbacks;
}

function getOptimizationWebSocketPath(level: OptimizationLevelKey): string {
  if (level === 'structured') return '/optimize-prompt/ws/structure-level-optimization';
  if (level === 'mastery') return '/optimize-prompt/ws/master-level-optimization';
  if (level === 'system') return '/optimize-prompt/ws/system-level-optimization';
  return '/optimize-prompt/ws/basic-level-optimization';
}

/**
 * Creates and opens a WebSocket connection for prompt optimization.
 * Returns the WebSocket instance so callers can manage its lifecycle (close, send stop, etc.).
 */
export function createOptimizationSocket(options: OptimizationSocketOptions): WebSocket | null {
  const wsBase = getWebSocketBaseUrl();
  if (!wsBase) {
    options.callbacks.onError?.('WebSocket endpoint is not configured. Please contact support.');
    return null;
  }

  const wsUrl = `${wsBase}${getOptimizationWebSocketPath(options.level)}`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        user_prompt: options.userPrompt,
        chat_id: options.chatId ?? null,
        user_id: options.userId,
      }),
    );
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const eventType = data.event;

      if (eventType === 'token' && data.data) {
        const partialText: string =
          data.data.partial_text ??
          data.data.token ??
          '';
        options.callbacks.onToken?.(partialText);
        return;
      }

      if (eventType === 'completed') {
        const newChatId = data.chat_id;
        const messageId = data.message_id;
        if (newChatId && newChatId !== 'undefined' && newChatId !== 'null') {
          options.callbacks.onCompleted?.(newChatId, messageId);
        }
        return;
      }

      if (eventType === 'optimization_complete') {
        const payload = data.data || {};
        const newChatId = payload.chat_id;
        const messageId = payload.message_id;
        if (newChatId && newChatId !== 'undefined' && newChatId !== 'null') {
          options.callbacks.onCompleted?.(newChatId, messageId);
        }
        return;
      }

      if (eventType === 'model_end' && data.data) {
        const finalText: string = data.data.final_text ?? '';
        if (finalText) {
          options.callbacks.onFinalText?.(finalText);
        }
        return;
      }

      if (eventType === 'error') {
        const messageText: string =
          data.message ||
          data.data?.error ||
          data.data ||
          'Sorry, something went wrong while optimizing your prompt. Please try again.';
        options.callbacks.onError?.(messageText);
        return;
      }

      if (eventType === 'cancelled') {
        options.callbacks.onCancelled?.();
        return;
      }
    } catch (err) {
      logError(err, 'createOptimizationSocket.onmessage');
    }
  };

  socket.onerror = (event) => {
    logError(event, 'createOptimizationSocket.onerror');
    options.callbacks.onError?.('WebSocket connection error. Please try again.');
  };

  return socket;
}


