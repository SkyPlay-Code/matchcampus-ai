import React, { useState, useRef, useEffect } from 'react';
import { streamChat, OPENING_MESSAGE } from '../services/gemini';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onRecommendationReady: (text: string) => void;
}

export function Chat({ messages, setMessages, onRecommendationReady }: ChatProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', content: OPENING_MESSAGE }]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      let aiResponse = '';
      setMessages([...newMessages, { role: 'model', content: '' }]);
      
      const stream = streamChat(newMessages, userMessage);
      
      for await (const chunk of stream) {
        if (chunk.isGeneratingList) {
          setIsGeneratingList(true);
        }
        aiResponse += chunk.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiResponse;
          return updated;
        });
      }
      
      if (aiResponse.includes('SECTION 2 — YOUR COLLEGE LIST')) {
        onRecommendationReady(aiResponse);
      }
      
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "I'm sorry, I encountered an error. Please try again.";
        return updated;
      });
    } finally {
      setIsTyping(false);
      setIsGeneratingList(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-white text-slate-900 border-l-4 border-amber-500 shadow-sm'
                  : 'bg-slate-900 text-white shadow-md'
              }`}
            >
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-amber-500 prose-strong:text-inherit">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-md flex items-center space-x-2">
              {isGeneratingList ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-sm text-slate-300">Building your college list...</span>
                </>
              ) : (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-white border border-slate-300 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm text-slate-900"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="text-xs text-slate-400 font-medium">CampusMatch · Powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}
