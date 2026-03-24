import React, { useState, useRef, useEffect } from 'react';
import { streamChat, OPENING_MESSAGE } from '../services/gemini';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { tryParseWhenComplete, ParsedResults } from '../utils/parser';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onRecommendationReady: (results: ParsedResults) => void;
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
      
      const parsed = tryParseWhenComplete(aiResponse);
      if (parsed) {
        onRecommendationReady(parsed);
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

  const isFirstInSequence = (idx: number) => {
    if (idx === 0) return true;
    return messages[idx - 1].role !== messages[idx].role;
  };

  return (
    <div className="flex flex-col h-full mx-auto w-full bg-[#0a0f1c]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            {msg.role === 'model' && isFirstInSequence(idx) ? (
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[#0a0f1c] font-bold text-sm mr-3 flex-shrink-0 mt-1">
                C
              </div>
            ) : msg.role === 'model' ? (
              <div className="w-8 mr-3 flex-shrink-0"></div>
            ) : null}
            
            <div
              className={`relative ${
                msg.role === 'user'
                  ? 'bg-transparent text-[#94a3b8] border-l-[3px] border-amber-500 rounded-none py-3 pl-5 pr-4 ml-auto max-w-[80%]'
                  : 'bg-[#141c2e] text-[#e2e8f0] border border-white/5 rounded-[16px] rounded-tl-[4px] px-5 py-4 max-w-[85%]'
              }`}
            >
              <div className="prose prose-sm max-w-none prose-p:leading-[1.7] prose-a:text-amber-500 prose-strong:text-white text-[15px]">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="absolute -bottom-5 right-0 text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[#0a0f1c] font-bold text-sm mr-3 flex-shrink-0 mt-1">
              C
            </div>
            <div className="bg-[#141c2e] text-[#e2e8f0] border border-white/5 rounded-[16px] rounded-tl-[4px] px-5 py-4 flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              </div>
              <span className="text-[13px] text-slate-400">CampusMatch is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#0a0f1c] border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-[#141c2e] border border-white/10 rounded-xl pl-[18px] pr-[50px] py-[14px] focus:outline-none focus:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0)] focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] text-white text-[15px] transition-all placeholder:text-[#475569]"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-amber-500 hover:bg-amber-600 text-[#0a0f1c] rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="text-[11px] text-[#334155] font-medium">CampusMatch · Powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}
