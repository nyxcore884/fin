"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would call your Genkit flow here
    // const response = await yourAIFlow({ query: input });
    const aiResponse = "This is a simulated response. In a real application, I would provide a detailed analysis based on your question about the financial data.";
    
    setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-glow-primary hover:scale-110"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-8 w-8" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-headline flex items-center gap-2 text-2xl">
              <Bot className="text-primary" />
              AI Assistant
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs rounded-xl px-4 py-3 text-sm lg:max-w-md ${
                        message.role === 'user'
                          ? 'rounded-br-none bg-primary text-primary-foreground'
                          : 'rounded-bl-none bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                     {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        <div className="rounded-xl bg-muted px-4 py-3 text-sm">
                            Thinking...
                        </div>
                    </div>
                )}
                 {messages.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground p-8">
                        <p>Ask me anything about your financial data!</p>
                    </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="pr-12"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                disabled={isLoading || !input.trim()}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
