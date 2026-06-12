'use client';

import { type ComponentProps, useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react'; // Icon for closing the popup

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  className?: string;
}

function extractImageUrl(text: string): string | null {
  // Regex to find URLs ending in common image extensions
  const regex = /https?:\/\/\S+\.(avif|webp|png|jpe?g|gif)/gi;
  const match = text.match(regex);
  return match ? match[0] : null;
}

// Helper to clean the message text by removing the image URL if it's present
// This prevents the raw URL from showing up next to the rendered image
function cleanMessageText(text: string, imageUrl: string | null): string {
  if (!imageUrl) return text;
  // Remove the markdown image syntax if present
  let cleaned = text.replace(new RegExp(`!\\[.*?\\]\\(${imageUrl}\\)`, 'g'), '');
  // Remove the raw URL if present
  cleaned = cleaned.replace(imageUrl, '');
  // Clean up extra whitespace/newlines left behind
  return cleaned.trim();
}

export function AgentChatTranscript({
  agentState,
  messages = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [popupImage, setPopupImage] = useState<string | null>(null);
  
  // NEW: Custom Pagination State for smooth performance
  const [visibleCount, setVisibleCount] = useState(30);

  // Calculate paginated messages using useMemo for performance
  const paginatedMessages = useMemo(() => {
    // We show the most recent 'visibleCount' messages
    const startIdx = Math.max(0, messages.length - visibleCount);
    return messages.slice(startIdx);
  }, [messages, visibleCount]);

  const hasMore = messages.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

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
    <>
      <Conversation className={className} {...props}>
        {/* Ensure overflow-y-auto is present to allow scrolling up */}
        <ConversationContent className="overflow-y-auto">
          {/* NEW: Load More Button for older messages */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadMore}
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
            const cleanedText = cleanMessageText(message, imageUrl);
            const isExpanded = expandedIds.has(id);

            return (
              <Message key={id} title={title} from={messageOrigin}>
                <MessageContent>
                  {/* Render cleaned text without the raw URL */}
                  <MessageResponse>{cleanedText || message}</MessageResponse>
                  
                  {/* Render Reference Diagram if available */}
                  {imageUrl && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Reference Diagram:
                      </p>
                      <button
                        onClick={() => setPopupImage(imageUrl)}
                        className="block overflow-hidden rounded-lg border hover:border-primary transition-colors w-full"
                        aria-label="Click to expand diagram"
                      >
                        <img
                          src={imageUrl}
                          alt="Reference diagram"
                          className={`object-contain transition-all w-full ${
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

      {/* NEW: Popup Image Modal */}
      {popupImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPopupImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setPopupImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close popup"
            >
              <X size={32} />
            </button>
            <img 
              src={popupImage} 
              alt="Full size reference diagram" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
          </div>
        </div>
      )}
    </>
  );
}
// updated