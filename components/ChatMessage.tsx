import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check, Speaker, StopCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { type Message, type MessagePart } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { LANGUAGES } from '../constants/languages';

interface ChatMessageProps {
  message: Message;
  language: string;
}

// Custom component to render code blocks with syntax highlighting and a copy button
// FIX: Replaced 'any' with a specific type for props to enable proper type inference and fix errors.
const CodeBlock = ({ node, ...props }: { node?: any } & React.ComponentProps<'pre'>) => {
  const [isCopied, setIsCopied] = useState(false);

  // FIX: Type guard to ensure children[0] is a valid React element before accessing its props.
  // This resolves TypeScript errors where properties were not found on type 'unknown'.
  // Defensive check: children should exist and have the code content
  if (!props.children || !Array.isArray(props.children) || props.children.length === 0 || !React.isValidElement(props.children[0])) {
    return <pre {...props} />;
  }
  
  const codeElement = props.children[0];
  const codeString = String(codeElement.props.children).replace(/\n$/, '');
  
  const languageMatch = /language-(\w+)/.exec(codeElement.props.className || '');
  const language = languageMatch ? languageMatch[1] : 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="relative group/code text-left my-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-1 bg-gray-700 rounded-md text-gray-300 opacity-0 group-hover/code:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Copy code to clipboard"
      >
        {isCopied ? 
          <Check className="w-4 h-4 text-green-400" /> : 
          <Copy className="w-4 h-4" />
        }
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="pre"
        customStyle={{
          borderRadius: '0.375rem',
          padding: '1rem',
          margin: 0,
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, language }) => {
  const { isSpeaking, speak, cancel, hasSpeechSupport } = useTextToSpeech();
  const { role, parts, groundingChunks } = message;
  const isUser = role === 'user';
  
  const handleSpeak = () => {
    const textToSpeak = parts
      .filter((part): part is { text: string } => 'text' in part && !!part.text)
      .map(part => part.text)
      .join(' ');
      
    if (!textToSpeak) return;

    const langInfo = LANGUAGES.find(l => l.name === language);
    const langCode = langInfo ? langInfo.code : 'en';
    
    if (isSpeaking) {
        cancel();
    } else {
        speak(textToSpeak, langCode);
    }
  };

  const wrapperClass = isUser ? 'flex justify-end' : 'flex justify-start';
  const bubbleClass = isUser
    ? 'bg-blue-600 text-white'
    : 'bg-gray-800 text-gray-200';
  
  const Icon = isUser ? User : Bot;
  const iconClass = isUser ? "text-blue-300" : "text-blue-400";
  
  const renderPart = (part: MessagePart, index: number) => {
    if ('inlineData' in part) {
      return (
        <img
          key={index}
          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
          alt="User upload"
          className="rounded-lg max-w-sm"
        />
      );
    }
    if (part.text) {
      return (
        <ReactMarkdown 
          key={index}
          remarkPlugins={[remarkGfm]}
          components={{
            pre: CodeBlock
          }}
        >
          {part.text || "..."}
        </ReactMarkdown>
      );
    }
    return null;
  };

  return (
    <div className={`${wrapperClass} my-4 group`}>
      <div className="flex items-center space-x-3 max-w-full sm:max-w-2xl">
        {!isUser && (
          <div className="flex-shrink-0 self-start w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${iconClass}`} />
          </div>
        )}
        <div className={`p-3 rounded-lg ${bubbleClass} prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0`}>
          <div className="space-y-2">
            {parts.map(renderPart)}
          </div>
          {groundingChunks && groundingChunks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700/50 not-prose">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">SOURCES</h4>
              <ol className="list-decimal list-inside space-y-1">
                {groundingChunks.map((chunk, index) => (
                  <li key={index} className="text-xs truncate">
                    <a
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                      title={chunk.web.title}
                    >
                      {chunk.web.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {!isUser && hasSpeechSupport && parts.some(p => 'text' in p && p.text.trim()) && (
          <div className="flex-shrink-0 self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
              aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
            >
              {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Speaker className="w-4 h-4" />}
            </button>
          </div>
        )}

        {isUser && (
          <div className="flex-shrink-0 self-start w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${iconClass}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
