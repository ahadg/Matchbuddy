import { appConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { ApiDirectMessage, ApiListingMessage } from '@/types/api';

type ActiveChatSocketOptions = {
  listingId?: string;
  onDirectMessage?: (message: ApiDirectMessage) => void;
  onError?: (message: string) => void;
  onListingMessage?: (message: ApiListingMessage) => void;
  threadId?: string;
};

function buildRealtimeUrl() {
  if (!appConfig.api.enabled) {
    return null;
  }

  try {
    const url = new URL(appConfig.api.baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export async function connectActiveChatSocket(options: ActiveChatSocketOptions) {
  const realtimeUrl = buildRealtimeUrl();

  if (!realtimeUrl || (!options.threadId && !options.listingId)) {
    return () => undefined;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return () => undefined;
  }

  let disposed = false;
  let socket: null | WebSocket = null;
  let reconnectTimeout: null | ReturnType<typeof setTimeout> = null;

  const connect = () => {
    if (disposed) {
      return;
    }

    const nextSocket = new WebSocket(realtimeUrl);
    socket = nextSocket;

    const subscribeToActiveChannel = () => {
      if (options.threadId) {
        nextSocket.send(
          JSON.stringify({
            type: 'subscribe_direct_thread',
            threadId: options.threadId,
          }),
        );
      }

      if (options.listingId) {
        nextSocket.send(
          JSON.stringify({
            type: 'subscribe_listing_room',
            listingId: options.listingId,
          }),
        );
      }
    };

    nextSocket.onopen = () => {
      nextSocket.send(
        JSON.stringify({
          type: 'authenticate',
          token: session.access_token,
        }),
      );
    };

    nextSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as Record<string, unknown>;

        if (payload.type === 'auth_ack') {
          subscribeToActiveChannel();
          return;
        }

        if (payload.type === 'direct_message_created' && payload.message && options.onDirectMessage) {
          options.onDirectMessage(payload.message as ApiDirectMessage);
          return;
        }

        if (payload.type === 'listing_message_created' && payload.message && options.onListingMessage) {
          options.onListingMessage(payload.message as ApiListingMessage);
          return;
        }

        if (payload.type === 'error' && typeof payload.error === 'string') {
          options.onError?.(payload.error);
        }
      } catch {
        options.onError?.('Realtime update could not be parsed.');
      }
    };

    nextSocket.onerror = () => {
      options.onError?.('Realtime connection failed.');
    };

    nextSocket.onclose = () => {
      if (disposed) {
        return;
      }

      reconnectTimeout = setTimeout(connect, 2000);
    };
  };

  connect();

  return () => {
    disposed = true;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    try {
      socket?.close();
    } catch {
      return;
    }
  };
}
