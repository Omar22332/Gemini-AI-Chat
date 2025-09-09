import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Chat } from '@google/genai';
import { type Message, MessagePart, GroundingChunk } from './types';
import Header from './components/Header';
import ChatHistory from './components/ChatHistory';
import ChatInput from './components/ChatInput';
import { initializeChat } from './services/geminiService';

const CHAT_HISTORY_KEY = 'gemini_chat_history';
const CHAT_LANGUAGE_KEY = 'gemini_chat_language';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse chat history from localStorage", e);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState<boolean>(false);
  
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem(CHAT_LANGUAGE_KEY) || 'English';
  });

  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    } catch (e) {
      console.error("Failed to save chat history to localStorage", e);
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(CHAT_LANGUAGE_KEY, language);
  }, [language]);

  // Initializes a brand new chat session, usually for the first visit or explicit new chat action.
  const startNewChat = useCallback(async (lang: string) => {
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clears state and triggers localStorage removal

    try {
      chatRef.current = initializeChat(lang);
      const result = await chatRef.current.sendMessage({ message: "Introduce yourself briefly and warmly in one or two sentences." });
      setMessages([{ role: 'model', parts: [{ text: result.text }] }]);
    } catch (e) {
      console.error(e);
      setError('Failed to initialize the AI model. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial load. Restores session or starts a new one.
  useEffect(() => {
    const initialize = async () => {
      if (messages.length === 0) {
        // No previous session, start a new chat with a greeting.
        await startNewChat(language);
      } else {
        // Restore previous session. The messages are already in state.
        // We just need to initialize the gemini chat instance with the history.
        chatRef.current = initializeChat(language, messages);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    startNewChat(newLang);
  };

  const handleNewChat = () => {
    startNewChat(language);
  };

  const handleSendMessage = useCallback(async (text: string, image?: { mimeType: string; data: string; }) => {
    if (isLoading || (!text.trim() && !image)) return;

    setIsLoading(true);
    setError(null);

    const userParts: MessagePart[] = [];
    if (image) {
      userParts.push({ inlineData: image });
    }
    if (text.trim()) {
      userParts.push({ text });
    }

    const userMessage: Message = { role: 'user', parts: userParts };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (!chatRef.current) {
        throw new Error('Chat session not initialized.');
      }
      
      const streamParams: any = { message: userParts };
      if (isSearchEnabled) {
          streamParams.config = { tools: [{googleSearch: {}}] };
      }
      const stream = await chatRef.current.sendMessageStream(streamParams);
      
      let modelResponse = '';
      const groundingChunks: GroundingChunk[] = [];
      const seenUris = new Set<string>();

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        
        const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (newChunks) {
            newChunks.forEach((c: GroundingChunk) => {
                if (c.web?.uri && !seenUris.has(c.web.uri)) {
                    groundingChunks.push(c);
                    seenUris.add(c.web.uri);
                }
            });
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            lastMessage.parts = [{ text: modelResponse }];
            if (groundingChunks.length > 0) {
                lastMessage.groundingChunks = [...groundingChunks];
            }
          }
          return newMessages;
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(errorMessage);
      setError(`Sorry, I encountered an error. ${errorMessage}`);
      setMessages(prev => {
        // Remove the empty model message placeholder on error
        const lastMessage = prev[prev.length - 1];
        const lastMessagePart = lastMessage?.parts?.[0];
        if (lastMessage?.role === 'model' && lastMessagePart && 'text' in lastMessagePart && lastMessagePart.text === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isSearchEnabled]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        onNewChat={handleNewChat}
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
        isSearchEnabled={isSearchEnabled}
        onToggleSearch={() => setIsSearchEnabled(prev => !prev)}
      />
      <ChatHistory messages={messages} isLoading={isLoading && messages.length === 0} language={language} />
      <div className="px-4 pb-4 sm:px-6 lg:px-8">
        {error && <p className="text-red-400 text-center mb-2">{error}</p>}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} language={language}/>
      </div>
    </div>
  );
};

export default App;