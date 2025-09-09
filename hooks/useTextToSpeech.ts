import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const hasSpeechSupport = typeof window !== 'undefined' && !!window.speechSynthesis;

  const populateVoiceList = useCallback(() => {
    if (hasSpeechSupport) {
      const newVoices = window.speechSynthesis.getVoices();
      setVoices(newVoices);
    }
  }, [hasSpeechSupport]);
  
  useEffect(() => {
    populateVoiceList();
    if (hasSpeechSupport && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, [populateVoiceList, hasSpeechSupport]);

  const speak = (text: string, lang: string) => {
    if (isSpeaking) {
      cancel();
      return;
    }
    
    if (!text || !hasSpeechSupport) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voiceForLang = voices.find(v => v.lang === lang) || voices.find(v => v.lang.split('-')[0] === lang.split('-')[0]) || null;
    utterance.voice = voiceForLang;
    utterance.lang = lang;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (hasSpeechSupport) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return { isSpeaking, speak, cancel, hasSpeechSupport };
};
