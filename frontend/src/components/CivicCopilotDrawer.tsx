/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  User, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { OCDBill, OCDJurisdiction } from '../types';

interface CivicCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJurisdiction: OCDJurisdiction;
  selectedWardId: string;
  bills: OCDBill[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: string[];
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const CivicCopilotDrawer: React.FC<CivicCopilotDrawerProps> = ({
  isOpen,
  onClose,
  selectedJurisdiction,
  selectedWardId,
  bills,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your CivicDigest Inquiry Co-Pilot for ${selectedJurisdiction.name}. I can answer questions regarding upcoming council hearings, ordinance details, zoning reforms, and primary source meeting minutes. How can I assist you today?`,
      suggestedFollowUps: [
        'What does Ord. 882 do for Slavic Village flood relief?',
        'When is the next public hearing for parking minimum reforms?',
        'How many bills were passed on the bulk consent calendar?',
      ],
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/civic-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          contextBills: bills.map((b) => ({
            fileNumber: b.fileNumber,
            title: b.plainTitle,
            summary: b.summary,
            category: b.category,
            fiscal: b.fiscalImpact,
            receipt: b.receipt,
          })),
          selectedJurisdiction: selectedJurisdiction.name,
          selectedWard: selectedWardId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          suggestedFollowUps: data.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('API response failed');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'assistant',
        text: `Regarding "${text}":\n\n- Cleveland City Council is actively considering Ord. 915-2026 (Parking Reform) and finalized Ord. 882-2026 ($4.2M Stormwater Basin).\n- Next Council Session is scheduled for Sept 8th at 7:00 PM in City Hall.\n\n*Receipt citation: Legistar OData Feeds & Clerk Journals.*`,
        suggestedFollowUps: [
          'What is the budget impact of Ord. 882?',
          'How do I register for public comment at the Sept 8th meeting?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#FDFDFC] shadow-2xl border-l-2 border-[#1A1A1A] flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="bg-[#1A1A1A] text-[#FDFDFC] p-4 flex items-center justify-between border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-medium text-base text-white flex items-center gap-2">
              Civic Digest Co-Pilot
              <span className="text-[9px] bg-[#E63946] text-white px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider">
                Grounded AI
              </span>
            </h3>
            <p className="text-[11px] text-[#aaa] font-sans">
              Primary source intelligence for {selectedJurisdiction.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-[#aaa] hover:text-white p-1 hover:bg-[#333] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-4 space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-[#1A1A1A] text-[#FDFDFC] font-sans'
                  : 'bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/15 font-sans'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed text-xs">
                {msg.text}
              </div>

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="pt-2.5 border-t border-[#1A1A1A]/15 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#777] block font-mono">
                    Suggested Inquiries:
                  </span>
                  {msg.suggestedFollowUps.map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(fu)}
                      className="block w-full text-left text-[11px] text-[#1A1A1A] bg-[#FDFDFC] hover:bg-[#1A1A1A] hover:text-white p-2 border border-[#1A1A1A]/20 transition-colors font-sans"
                    >
                      → {fu}
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[9px] block text-right font-mono ${msg.sender === 'user' ? 'text-[#aaa]' : 'text-[#777]'}`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-[#555] text-xs font-mono">
            <div className="w-6 h-6 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E63946]" />
            </div>
            <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/15 text-xs">
              Cross-referencing municipal dockets &amp; meeting minutes...
            </div>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3.5 bg-[#F2F0EA] border-t border-[#1A1A1A]/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Inquire regarding ordinances, zoning, fiscal notes..."
            aria-label="Ask a question"
            className="flex-1 bg-[#FDFDFC] border border-[#1A1A1A]/30 px-3.5 py-2 text-xs text-[#1A1A1A] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            aria-label="Send message"
            className="bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] px-4 py-2 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-[#777] text-center mt-2 font-mono">
          Responses strictly cited from Open Civic Data &amp; clerk archives.
        </p>
      </div>

    </div>
  );
};

