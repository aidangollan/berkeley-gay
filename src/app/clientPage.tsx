"use client"

import { useState, useRef, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import type { Message, TypewriterText } from '~/types';
import { getTimestamp, streamResponse } from '~/lib/terminal-utils';
import { TerminalHeader } from '~/components/terminal/terminal-header';
import { InitializationMessages } from '~/components/terminal/initial-messages';
import { MessageList } from '~/components/terminal/message-list';
import { TerminalInput } from '~/components/terminal/terminal-input';

export default function HomePageClient({
    numFailedUsers,
    numFailedMessages
} : {
    numFailedUsers: number;
    numFailedMessages: number;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [initLines, setInitLines] = useState<TypewriterText[]>([
      { text: "", isComplete: false },
      { text: "", isComplete: false },
      { text: "", isComplete: false },
    ]);
    const [isInitialized, setIsInitialized] = useState(false);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    useEffect(() => {
      const lines = [
        "hello gaybo",
        "buckle your pants",
        "because you're about to be squelched"
      ];
      
      const typeWriter = async (lineIndex: number, currentText: string) => {
        if (lineIndex >= lines.length) {
          setIsInitialized(true);
          return;
        }
  
        if (currentText.length < (lines[lineIndex]?.length ?? 0)) {
          setInitLines(prev => {
            const newLines = [...prev];
            newLines[lineIndex] = {
              text: (lines[lineIndex]?.slice(0, currentText.length + 1) ?? ''),
              isComplete: false
            };
            return newLines;
          });
  
          setTimeout(() => {
            void typeWriter(lineIndex, currentText + ((lines[lineIndex]?.[currentText.length]) ?? ''));
          }, 30);
        } else {
          setInitLines(prev => {
            const newLines = [...prev];
            newLines[lineIndex] = {
              text: lines[lineIndex] ?? '',
              isComplete: true
            };
            return newLines;
          });
  
          setTimeout(() => {
            void typeWriter(lineIndex + 1, "");
          }, 200);
        }
      };
  
      void typeWriter(0, "");
    }, []);

    const resetConversation = () => {
      setMessages([]);
      setInput('');
      setIsStreaming(false);
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming || !isInitialized) return;
      
        const userMessage: Message = { 
          role: 'user', 
          content: input,
          timestamp: getTimestamp()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);
      
        let streamedContent = '';
        await streamResponse(
          (chunk) => {
            streamedContent += chunk;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: streamedContent,
                timestamp: getTimestamp()
              };
              return newMessages;
            });
          },
          () => {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: '', 
              timestamp: getTimestamp()
            }]);
          },
          input,
          messages
        );
      
        setIsStreaming(false);
      };

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] pt-6">
        <Card className="w-full max-w-2xl h-[490px] bg-[#232323] border-[#333333] shadow-2xl overflow-hidden">
          <div className="flex flex-col h-full">
            <TerminalHeader 
              onReset={resetConversation} 
            />
            <ScrollArea className="flex-1 p-3 font-mono text-sm">
              <InitializationMessages 
                initLines={initLines} 
                isInitialized={isInitialized} 
              />
              <MessageList messages={messages} />
              <div ref={messagesEndRef} />
            </ScrollArea>
            <TerminalInput
              input={input}
              setInput={setInput}
              isStreaming={isStreaming}
              isInitialized={isInitialized}
              onSubmit={handleSubmit}
            />
          </div>
        </Card>
      </main>
    );
}