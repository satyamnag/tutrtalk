'use client';

import { type ComponentProps, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  /**
   * The current state of the agent. When 'thinking', displays a loading indicator.
   */
  agentState?: AgentState;
  /**
   * Array of messages to display in the transcript.
   * @defaultValue []
   */
  messages?: ReceivedMessage[];
  /**
   * Additional CSS class names to apply to the conversation container.
   */
  className?: string;
}

// Helper: detect an image URL in a string and return the URL if found
function extractImageUrl(text: string): string | null {
  const regex = /https?:\/\/\S+\.(avif|webp|png|jpe?g|gif)/gi;
  const match = text.match(regex);
  return match ? match[0] : null;
}

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentChatTranscript
 *   agentState={agentState}
 *   messages={chatMessages}
 * />
 * ```
 */
export function AgentChatTranscript({
  agentState,
  messages = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <>
      <Conversation className={className} {...props}>
        <ConversationContent>
          {messages.map((receivedMessage) => {
            const { id, timestamp, from, message } = receivedMessage;
            const locale = navigator?.language ?? 'en-US';
            const messageOrigin = from?.isLocal ? 'user' : 'assistant';
            const time = new Date(timestamp);
            const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

            const imageUrl = extractImageUrl(message);

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
                        onClick={() => setZoomedImage(imageUrl)}
                        className="block cursor-zoom-in overflow-hidden rounded-lg border hover:border-primary transition-colors"
                        aria-label="Click to zoom diagram"
                      >
                        <img
                          src={imageUrl}
                          alt="Reference diagram"
                          className="max-h-48 w-auto object-contain"
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

      {/* Lightbox overlay when a diagram is zoomed */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-background p-1.5 text-foreground shadow-md hover:bg-accent transition-colors"
              aria-label="Close zoomed diagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed reference diagram"
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}