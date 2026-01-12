'use client';

import { Message } from '@/types/chat';
import MessageItem from './MessageItem';
import { Loader } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
            <div className="flex items-center gap-2 max-w-xs px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                <Loader className="h-4 w-4 animate-spin"/>
                <p className="text-sm">Analyzing...</p>
            </div>
        </div>
      )}
    </div>
  );
}
