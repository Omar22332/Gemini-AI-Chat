import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, LoaderCircle, Paperclip, X, Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { LANGUAGES } from '../constants/languages';


interface ChatInputProps {
  onSendMessage: (message: string, image?: { mimeType: string; data: string; }) => void;
  isLoading: boolean;
  language: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, language }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File, preview: string, data: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      setText(prevText => (prevText ? prevText + ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      const langCode = LANGUAGES.find(l => l.name === language)?.code || 'en-US';
      startListening(langCode);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 192); // 192px is roughly max-h-48
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [text]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const data = await fileToBase64(file);
      setImage({ file, preview, data });
    }
  };

  const removeImage = () => {
    setImage(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    onSendMessage(text, image ? { mimeType: image.file.type, data: image.data } : undefined);
    setText('');
    removeImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      <div className="block bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
        {image && (
          <div className="p-2 relative">
            <img src={image.preview} alt="preview" className="max-h-24 rounded-md"/>
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-3 right-3 p-1 bg-gray-900/50 rounded-full text-white hover:bg-gray-900"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="relative flex items-end p-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isLoading}
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or use the microphone..."
            rows={1}
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none max-h-48 mx-2"
            disabled={isLoading}
          />
          {hasRecognitionSupport && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isListening ? 'text-red-400 bg-red-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || (!text.trim() && !image)}
            className="flex-shrink-0 ml-2 p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {isLoading ? (
              <LoaderCircle className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizonal className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;