import React, { useRef, useEffect } from 'react';
import { type Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  language: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, language }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Only show the initial app loader, not the message streaming loader.
  if (isLoading && messages.length === 0) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2 p-3 rounded-lg">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-5xl mx-auto">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} language={language} />
        ))}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-800">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatHistory;