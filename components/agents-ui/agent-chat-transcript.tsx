'use client';

import { type ComponentProps, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { type AgentState, type ReceivedMessage, usePagination } from '@livekit/components-react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Button } from '@/components/ui/button';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  className?: string;
}

function extractImageUrl(text: string): string | null {
  const regex = /https?:\/\/\S+\.(avif|webp|png|jpe?g|gif)/gi;
  const match = text.match(regex);
  return match ? match[0] : null;
}

export function AgentChatTranscript({
  agentState,
  messages = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // NEW: Implement Pagination for smooth performance in long sessions
  const { items: paginatedMessages, loadMore, hasMore } = usePagination(messages, {
    initialCount: 30, // Start by showing the latest 30 messages
    increment: 20,    // Load 20 more each time "Load More" is clicked
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Conversation className={className} {...props}>
      <ConversationContent>
        {/* NEW: Load More Button for older messages */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadMore()}
              className="text-xs font-medium"
            >
              Load earlier messages
            </Button>
          </div>
        )}

        {paginatedMessages.map((receivedMessage) => {
          const { id, timestamp, from, message } = receivedMessage;
          const locale = navigator?.language ?? 'en-US';
          const messageOrigin = from?.isLocal ? 'user' : 'assistant';
          const time = new Date(timestamp);
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });
          const imageUrl = extractImageUrl(message);
          const isExpanded = expandedIds.has(id);

          return (
            <Message key={id} title={title} from={messageOrigin}>
              <MessageContent>
                <MessageResponse>{message}</MessageResponse>
                {imageUrl && (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Ref. Diagram
                    </p>
                    <button
                      onClick={() => toggleExpand(id)}
                      className="block overflow-hidden rounded-lg border hover:border-primary transition-colors"
                      aria-label={isExpanded ? 'Collapse diagram' : 'Expand diagram'}
                    >
                      <img
                        src={imageUrl}
                        alt="Reference diagram"
                        className={`object-contain transition-all ${
                          isExpanded ? 'max-h-96' : 'max-h-48'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </MessageContent>
            </Message>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && <AgentChatIndicator size="sm" />}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}