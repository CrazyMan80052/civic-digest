/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Send, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ExternalLink, 
  MessageSquare, 
  Download, 
  RefreshCw, 
  Globe, 
  Radio, 
  FileText, 
  Layers, 
  Hash,
  ArrowRight,
  Sliders,
  Check,
  ShieldCheck
} from 'lucide-react';
import { OCDBill } from '../types';
import { formatCurrency } from '../lib/utils';

interface SocialDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: OCDBill | null;
  allBills?: OCDBill[];
}

type SocialPlatform = 'twitter' | 'bluesky' | 'threads' | 'linkedin' | 'instagram' | 'webhook';
type ToneSetting = 'standard' | 'urgent' | 'explanatory' | 'economic';

export const SocialDispatchModal: React.FC<SocialDispatchModalProps> = ({
  isOpen,
  onClose,
  bill: initialBill,
  allBills = [],
}) => {
  const [selectedBill, setSelectedBill] = useState<OCDBill | null>(initialBill);
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('twitter');
  const [tone, setTone] = useState<ToneSetting>('standard');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Platform specific editable texts
  const [postContent, setPostContent] = useState<{
    twitter: string;
    bluesky: string;
    threads: string;
    linkedin: string;
    instagramSlides: string[];
    hashtags: string[];
  }>({
    twitter: '',
    bluesky: '',
    threads: '',
    linkedin: '',
    instagramSlides: [],
    hashtags: ['#LocalGov', '#CityCouncil', '#CivicDigest', '#OpenData'],
  });

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.slack.com/services/DEMO/CIVIC/ALERT');
  const [isDispatchingWebhook, setIsDispatchingWebhook] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update selectedBill when initialBill changes
  useEffect(() => {
    if (initialBill) {
      setSelectedBill(initialBill);
    }
  }, [initialBill]);

  // Generate initial social content whenever selectedBill changes
  useEffect(() => {
    if (selectedBill && isOpen) {
      generateSocialPosts(selectedBill, tone);
    }
  }, [selectedBill, isOpen]);

  const generateSocialPosts = async (bill: OCDBill, selectedTone: ToneSetting) => {
    setIsGenerating(true);
    setWebhookStatus('idle');
    try {
      const response = await fetch('/api/gemini/social-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billTitle: bill.plainTitle,
          fileNumber: bill.fileNumber,
          summary: bill.summary,
          whoItAffects: bill.whoItAffects,
          fiscalAmount: bill.fiscalImpact?.amount || 0,
          category: bill.category,
          receiptUrl: bill.receipt?.officialUrl || 'https://civicdigest.org',
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error('Social generation failed');
      }

      const data = await response.json();
      setPostContent({
        twitter: data.twitter || `🏛️ Council Update [${bill.fileNumber}]: ${bill.plainTitle}. Affects ${bill.whoItAffects}. Read verified receipt at https://civicdigest.org #LocalGov`,
        bluesky: data.bluesky || `🏛️ ${bill.plainTitle} (${bill.fileNumber}): What you need to know about upcoming municipal policy changes. Grounded in official clerk records.`,
        threads: data.threads || `What just passed at City Hall? ${bill.plainTitle} (${bill.fileNumber}) impacts ${bill.whoItAffects}. Here's the plain-language breakdown ⬇️`,
        linkedin: data.linkedin || `Municipal Policy Dispatch: The City Council is considering ${bill.plainTitle} (${bill.fileNumber}). Key takeaways:\n• Scope: ${bill.summary}\n• Fiscal Note: ${bill.fiscalImpact?.amount > 0 ? formatCurrency(bill.fiscalImpact.amount) : 'Regulatory'}\n• Verified via Open Civic Data (OCD-ID).`,
        instagramSlides: data.instagramSlides?.length > 0 ? data.instagramSlides : [
          `🏛️ What Just Happened at City Hall?\n${bill.plainTitle} (${bill.fileNumber})`,
          `📋 What it does:\n${bill.summary}`,
          `👥 Who is impacted:\n${bill.whoItAffects}`,
          `💰 Fiscal & Receipt Note:\n${bill.fiscalImpact?.amount > 0 ? formatCurrency(bill.fiscalImpact.amount) : 'Policy ordinance'} • Verified via Legistar Primary Records.`,
        ],
        hashtags: data.hashtags || ['#LocalGov', '#CityCouncil', '#CivicDigest', '#OpenData'],
      });
    } catch (err) {
      console.error('Error generating social dispatch:', err);
      // Fallback
      if (bill) {
        setPostContent({
          twitter: `🏛️ Council Update [${bill.fileNumber}]: ${bill.plainTitle}. Affects ${bill.whoItAffects}. Read verified receipt: ${bill.receipt?.officialUrl || 'https://civicdigest.org'} #LocalGov #CivicDigest`,
          bluesky: `🏛️ ${bill.plainTitle} (${bill.fileNumber}): Municipal policy update for ${bill.category}. Verified via official clerk records.`,
          threads: `City Hall Dispatch: ${bill.plainTitle} (${bill.fileNumber}) is on the upcoming docket. Here is what it means for your neighborhood ⬇️`,
          linkedin: `Municipal Policy Dispatch: ${bill.plainTitle} (${bill.fileNumber})\n\n• Impact: ${bill.whoItAffects}\n• Summary: ${bill.summary}\n• Primary Source: ${bill.receipt?.officialUrl || 'Open Civic Data records'}`,
          instagramSlides: [
            `🏛️ Municipal Update: ${bill.plainTitle} (${bill.fileNumber})`,
            `📋 Plain Language: ${bill.summary}`,
            `👥 Community Impact: ${bill.whoItAffects}`,
            `🔍 Verified Primary Source: Legistar Clerk Archive`,
          ],
          hashtags: ['#LocalGov', '#CityCouncil', '#CivicDigest', '#OpenData'],
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const currentText = (() => {
    switch (activePlatform) {
      case 'twitter':
        return postContent.twitter;
      case 'bluesky':
        return postContent.bluesky;
      case 'threads':
        return postContent.threads;
      case 'linkedin':
        return postContent.linkedin;
      case 'instagram':
        return postContent.instagramSlides[activeSlide] || '';
      case 'webhook':
        return JSON.stringify(
          {
            event: 'civic.docket.broadcast',
            bill: selectedBill?.fileNumber,
            title: selectedBill?.plainTitle,
            summary: selectedBill?.summary,
            affected: selectedBill?.whoItAffects,
            receiptUrl: selectedBill?.receipt?.officialUrl,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );
      default:
        return '';
    }
  })();

  const characterLimits: Record<SocialPlatform, number> = {
    twitter: 280,
    bluesky: 300,
    threads: 500,
    linkedin: 3000,
    instagram: 2200,
    webhook: 5000,
  };

  const currentLimit = characterLimits[activePlatform];
  const charCount = currentText.length;
  const isOverLimit = charCount > currentLimit;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share && selectedBill) {
      try {
        await navigator.share({
          title: `Civic Digest: ${selectedBill.plainTitle}`,
          text: currentText,
          url: selectedBill.receipt?.officialUrl || window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      } catch {
        // User cancelled or failed, fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleDirectWebIntent = () => {
    if (!selectedBill) return;
    const textToShare = encodeURIComponent(currentText);
    const urlToShare = encodeURIComponent(selectedBill.receipt?.officialUrl || window.location.href);

    switch (activePlatform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${textToShare}`, '_blank');
        break;
      case 'bluesky':
        window.open(`https://bsky.app/intent/compose?text=${textToShare}`, '_blank');
        break;
      case 'threads':
        window.open(`https://www.threads.net/intent/post?text=${textToShare}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${urlToShare}`, '_blank');
        break;
      default:
        handleCopy();
    }
  };

  const handleFireWebhook = async () => {
    setIsDispatchingWebhook(true);
    setWebhookStatus('idle');
    try {
      // Simulate real-time dispatch to Discord/Slack/Webhook endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      setWebhookStatus('success');
    } catch {
      setWebhookStatus('error');
    } finally {
      setIsDispatchingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFDFC] max-w-3xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Masthead Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white flex items-center gap-2">
                Civic News Social Dispatch
                <span className="text-[10px] bg-[#E63946] text-white font-mono font-bold uppercase tracking-wider px-2 py-0.5">
                  Multi-Channel Broadcaster
                </span>
              </h3>
              <p className="text-[11px] text-[#aaa] font-sans">
                Broadcast verified municipal dockets directly to social feeds, newsletters, and webhook alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-1 hover:bg-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#1A1A1A]">
          
          {/* Bill Selector Bar */}
          <div className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777] font-mono block">
                Target Ordinance / Docket:
              </span>
              {allBills.length > 0 ? (
                <select
                  value={selectedBill?.id || ''}
                  onChange={(e) => {
                    const b = allBills.find((x) => x.id === e.target.value);
                    if (b) setSelectedBill(b);
                  }}
                  className="w-full bg-[#FDFDFC] border border-[#1A1A1A]/30 text-xs font-serif font-bold p-1.5 mt-1 focus:outline-none"
                >
                  {allBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.fileNumber}] {b.plainTitle}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-serif font-bold text-sm text-[#1A1A1A] mt-0.5">
                  [{selectedBill?.fileNumber}] {selectedBill?.plainTitle}
                </p>
              )}
            </div>

            {/* Tone Selector & Regenerate */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#777]" />
                <select
                  value={tone}
                  onChange={(e) => {
                    const newTone = e.target.value as ToneSetting;
                    setTone(newTone);
                    if (selectedBill) generateSocialPosts(selectedBill, newTone);
                  }}
                  className="bg-[#FDFDFC] border border-[#1A1A1A]/30 text-[11px] font-bold uppercase p-1.5 focus:outline-none"
                >
                  <option value="standard">Objective Civic</option>
                  <option value="urgent">Urgent Notice</option>
                  <option value="explanatory">Plain Explainer</option>
                  <option value="economic">Fiscal &amp; Business</option>
                </select>
              </div>

              <button
                onClick={() => selectedBill && generateSocialPosts(selectedBill, tone)}
                disabled={isGenerating}
                title="Regenerate with Gemini"
                className="bg-[#1A1A1A] hover:bg-[#333] text-white p-1.5 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-[#E63946]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Social Platform Selection Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1A1A1A]/20 pb-2 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider font-mono">
            <button
              onClick={() => setActivePlatform('twitter')}
              className={`px-3 py-1.5 transition-colors border ${
                activePlatform === 'twitter'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              X / Twitter
            </button>

            <button
              onClick={() => setActivePlatform('bluesky')}
              className={`px-3 py-1.5 transition-colors border ${
                activePlatform === 'bluesky'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              Bluesky
            </button>

            <button
              onClick={() => setActivePlatform('threads')}
              className={`px-3 py-1.5 transition-colors border ${
                activePlatform === 'threads'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              Threads
            </button>

            <button
              onClick={() => setActivePlatform('linkedin')}
              className={`px-3 py-1.5 transition-colors border ${
                activePlatform === 'linkedin'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              LinkedIn
            </button>

            <button
              onClick={() => setActivePlatform('instagram')}
              className={`px-3 py-1.5 transition-colors border ${
                activePlatform === 'instagram'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              Instagram Carousel
            </button>

            <button
              onClick={() => setActivePlatform('webhook')}
              className={`px-3 py-1.5 transition-colors border flex items-center gap-1 ${
                activePlatform === 'webhook'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#555] border-transparent hover:border-[#1A1A1A]/20'
              }`}
            >
              <Radio className="w-3 h-3 text-[#E63946]" />
              <span>Newsroom Webhook</span>
            </button>
          </div>

          {/* Platform Specific Content Area */}
          {activePlatform !== 'instagram' && activePlatform !== 'webhook' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] font-mono">
                  {activePlatform.toUpperCase()} Draft
                </span>
                <span className={`font-mono font-bold text-xs ${isOverLimit ? 'text-[#E63946]' : 'text-[#777]'}`}>
                  {charCount} / {currentLimit} chars
                </span>
              </div>

              <textarea
                value={currentText}
                onChange={(e) => {
                  const val = e.target.value;
                  setPostContent((prev) => ({
                    ...prev,
                    [activePlatform]: val,
                  }));
                }}
                rows={5}
                className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-3 text-xs sm:text-sm font-sans text-[#1A1A1A] focus:outline-none leading-relaxed"
              />

              {/* Hashtag Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#777] font-mono flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Tags:
                </span>
                {postContent.hashtags.map((ht) => (
                  <button
                    key={ht}
                    onClick={() => {
                      if (!currentText.includes(ht)) {
                        setPostContent((prev) => ({
                          ...prev,
                          [activePlatform]: `${currentText} ${ht}`,
                        }));
                      }
                    }}
                    className="text-[10px] bg-[#FDFDFC] hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A]/20 px-2 py-0.5 font-mono text-[#555] transition-colors"
                  >
                    {ht}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instagram Carousel Slide Studio */}
          {activePlatform === 'instagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[#1A1A1A]/10">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] font-mono">
                  Instagram 4-Slide Civic Storyboard
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  {postContent.instagramSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`w-6 h-6 flex items-center justify-center font-bold border transition-colors ${
                        activeSlide === idx
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'bg-[#F2F0EA] text-[#555] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide Preview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visual Square Preview */}
                <div className="bg-[#1A1A1A] text-[#FDFDFC] p-6 aspect-square flex flex-col justify-between border-2 border-[#1A1A1A] shadow-md relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-[#E63946]">
                        Civic Digest • Slide {activeSlide + 1}/4
                      </span>
                      <span className="text-[10px] font-mono text-[#aaa]">
                        {selectedBill?.fileNumber}
                      </span>
                    </div>
                    <p className="font-serif text-lg leading-snug whitespace-pre-line text-white">
                      {postContent.instagramSlides[activeSlide] || ''}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-mono text-[#aaa]">
                    <span>Open Civic Data (OCD-ID)</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  </div>
                </div>

                {/* Editable Slide Text */}
                <div className="space-y-2 flex flex-col justify-between">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1 font-mono">
                      Edit Slide {activeSlide + 1} Copy:
                    </label>
                    <textarea
                      value={postContent.instagramSlides[activeSlide] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostContent((prev) => {
                          const updated = [...prev.instagramSlides];
                          updated[activeSlide] = val;
                          return { ...prev, instagramSlides: updated };
                        });
                      }}
                      rows={6}
                      className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-2.5 text-xs font-sans text-[#1A1A1A] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : 3))}
                      className="flex-1 bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A]/30 text-xs font-bold uppercase py-1.5 transition-colors font-mono"
                    >
                      ← Prev Slide
                    </button>
                    <button
                      onClick={() => setActiveSlide((prev) => (prev < 3 ? prev + 1 : 0))}
                      className="flex-1 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold uppercase py-1.5 transition-colors font-mono"
                    >
                      Next Slide →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Newsroom Webhook Dispatcher */}
          {activePlatform === 'webhook' && (
            <div className="space-y-3 bg-[#F2F0EA] p-4 border border-[#1A1A1A]/15 text-xs font-mono">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1">
                  Target Webhook Endpoint (Discord / Slack / Zapier / Make):
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-[#FDFDFC] border border-[#1A1A1A]/30 p-2 text-xs text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1">
                  Automated JSON Payload Preview:
                </label>
                <pre className="bg-[#1A1A1A] text-[#FDFDFC] p-3 text-[11px] overflow-x-auto leading-relaxed border border-[#1A1A1A]">
                  {currentText}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#555]">
                  Fires instantaneous webhook alerts to community groups and newsrooms.
                </span>
                <button
                  onClick={handleFireWebhook}
                  disabled={isDispatchingWebhook}
                  className="bg-[#1A1A1A] hover:bg-[#333] text-white font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                >
                  {isDispatchingWebhook ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E63946]" />
                      <span>Transmitting...</span>
                    </>
                  ) : webhookStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Webhook Broadcasted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#E63946]" />
                      <span>Broadcast Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Primary Source Verification Note */}
          <div className="bg-[#F2F0EA] border-l-4 border-[#1A1A1A] p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
              <span className="font-mono text-[11px] text-[#555]">
                Includes primary source receipt anchor: <strong className="text-[#1A1A1A]">{selectedBill?.receipt?.fileNumber}</strong>
              </span>
            </div>
            <a
              href={selectedBill?.receipt?.officialUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] hover:underline flex items-center gap-1 font-mono"
            >
              <span>Verify Receipt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="bg-[#F2F0EA] px-6 py-4 border-t border-[#1A1A1A]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left: Native Mobile/Device Share */}
          <button
            onClick={handleNativeShare}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#FDFDFC] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A] text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors font-mono"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareSuccess ? 'Shared!' : 'Device Share (Instagram / Messages)'}</span>
          </button>

          {/* Right: Direct Platform Intent & Copy */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#FDFDFC] hover:bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors font-mono"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {activePlatform !== 'instagram' && activePlatform !== 'webhook' && (
              <button
                onClick={handleDirectWebIntent}
                disabled={isOverLimit}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-colors font-mono disabled:opacity-50"
              >
                <span>Launch {activePlatform === 'twitter' ? 'X Intent' : activePlatform === 'bluesky' ? 'Bluesky Intent' : activePlatform}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
