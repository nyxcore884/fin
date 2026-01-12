'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AIChatProps {
  onClose: () => void;
  currentSessionId?: string;
}

export default function AIChat({ onClose, currentSessionId }: AIChatProps) {
  const { messages, sendMessage, isLoading, setInputMessage } = useChat({ currentSessionId });
  const [localMessage, setLocalMessage] = useState('');

  const handleSendMessage = () => {
    if (localMessage.trim()) {
      sendMessage(localMessage);
      setLocalMessage('');
    }
  };

  const handleQuickAction = (text: string) => {
    setLocalMessage(text);
    sendMessage(text);
    setLocalMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-background border border-primary rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-primary">
        <h3 className="text-lg font-semibold text-foreground">AI Financial Assistant</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <MessageList messages={messages} isLoading={isLoading} />
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="Ask about your financial data..."
            className="flex-1"
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!localMessage.trim() || isLoading}
          >
            Send
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickAction("What are the main cost drivers in my latest report?")}>Cost Analysis</Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickAction("Show me revenue trends across my reports")}>Revenue Trends</Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickAction("What anomalies were detected in my data?")}>Anomalies</Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleQuickAction("Give me recommendations for cost optimization")}>Recommendations</Button>
        </div>
      </div>
    </div>
  );
}
