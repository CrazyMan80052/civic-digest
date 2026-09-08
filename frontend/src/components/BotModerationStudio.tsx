/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Vote,
  Clock
} from 'lucide-react';
import { useModalKeyboard } from '../lib/useModalKeyboard';
import { formatCurrency } from '../lib/utils';

export interface PendingBotPost {
  id: string;
  bill_id: string;
  file_number: string;
  plain_title: string;
  the_what: string;
  the_who: string;
  fiscal_amount: number;
  platform: 'twitter' | 'bluesky' | 'mastodon' | 'webhook';
  status: 'PENDING_MODERATION' | 'QUEUED' | 'PUBLISHED' | 'REJECTED';
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  thread_content: string[];
  card_image_url: string;
  receipt_url: string;
  receipt_snippet: string;
  receipt_page: number;
  created_at: string;
}

interface BotModerationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onPostDispatched?: (post: PendingBotPost) => void;
}

type PlatformTab = 'twitter' | 'bluesky' | 'mastodon' | 'webhook';

export const BotModerationStudio: React.FC<BotModerationStudioProps> = ({
  isOpen,
  onClose,
  onPostDispatched,
}) => {
  const [posts, setPosts] = useState<PendingBotPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<PlatformTab>('twitter');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [isRollCallOpen, setIsRollCallOpen] = useState<boolean>(false);
  const [rollCallAction, setRollCallAction] = useState<string>('Passed');
  const [rollCallNotes, setRollCallNotes] = useState<string>('');
  const [rollCallAyes, setRollCallAyes] = useState<string>('Council President, Ward 12 Council Member, Majority');

  // Accessible keyboard Escape and focus trapping
  useModalKeyboard(isOpen, onClose);

  const fetchPendingPosts = useCallback(async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/bot/queue/pending');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        if (data.length > 0) {
          setSelectedPostId((prev) => prev || data[0].id);
        } else {
          setSelectedPostId(null);
        }
      }
    } catch {
      setActionMessage('Failed to load queue from API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPendingPosts();
    }
  }, [isOpen, fetchPendingPosts]);

  const selectedPost = posts.find((p) => p.id === selectedPostId) || posts[0] || null;

  const handleApprove = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bot/queue/${selectedPost.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderator_name: 'Lead Civic Editor', notes: 'Verified and approved' }),
      });
      if (res.ok) {
        setActionMessage(`✓ Post for ${selectedPost.file_number} approved and transitioned to QUEUED.`);
        if (onPostDispatched) onPostDispatched(selectedPost);
        setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
        const remaining = posts.filter((p) => p.id !== selectedPost.id);
        setSelectedPostId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      setActionMessage('Failed to approve post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost || !rejectReason.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bot/queue/${selectedPost.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason, moderator_name: 'Lead Civic Editor' }),
      });
      if (res.ok) {
        setActionMessage(`Rejected ${selectedPost.file_number} with audit reason.`);
        setShowRejectInput(false);
        setRejectReason('');
        setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
        const remaining = posts.filter((p) => p.id !== selectedPost.id);
        setSelectedPostId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      setActionMessage('Failed to reject post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRollCall = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const ayesList = rollCallAyes.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('/api/bot/override/roll-call-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: selectedPost.bill_id,
          file_number: selectedPost.file_number,
          action: rollCallAction,
          ayes: ayesList,
          nays: [],
          notes: rollCallNotes || 'Verified manual floor vote override',
        }),
      });
      if (res.ok) {
        setActionMessage(`✓ Floor roll-call vote logged for ${selectedPost.file_number} (${ayesList.length} Ayes).`);
        setIsRollCallOpen(false);
      }
    } catch {
      setActionMessage('Failed to record floor roll-call.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerPipelineRun = async (placeName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bot/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_name: placeName, state_code: 'OH', top: 3 }),
      });
      if (res.ok) {
        setActionMessage(`✓ Pipeline ran for ${placeName}. New posts enqueued.`);
        fetchPendingPosts();
      }
    } catch {
      setActionMessage('Failed to run pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bot-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-[#111827] text-gray-100 w-full max-w-5xl max-h-[92vh] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1A2234]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="bot-studio-title" className="text-lg font-bold tracking-tight text-white">
                  Civic Bot Moderation Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HITL Protocol Active
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Human-In-The-Loop review of automated municipal dockets before social broadcast
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPendingPosts}
              disabled={isLoading}
              aria-label="Refresh moderation queue"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close moderation studio"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionMessage && (
          <div className="px-5 py-2.5 bg-blue-950/80 border-b border-blue-800 text-blue-200 text-xs flex items-center justify-between">
            <span className="font-medium">{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-blue-400 hover:text-blue-200 text-xs">Dismiss</button>
          </div>
        )}

        {/* Body Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Pending Queue List */}
          <div className="w-full md:w-80 border-r border-gray-800 bg-[#0D1320] flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Pending Queue ({posts.length})</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleTriggerPipelineRun('Dublin')}
                  className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-[10px]"
                >
                  + Dublin
                </button>
                <button
                  onClick={() => handleTriggerPipelineRun('Cleveland')}
                  className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-[10px]"
                >
                  + Cleveland
                </button>
              </div>
            </div>

            <div className="p-2 space-y-2 flex-1">
              {posts.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  <p className="font-semibold text-gray-400">Queue is Clear</p>
                  <p className="mt-1">All scraped municipal dockets have been moderated.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isSelected = post.id === selectedPostId;
                  return (
                    <button
                      key={post.id}
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setShowRejectInput(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? 'bg-gray-800/90 border-blue-500/60 shadow-md ring-1 ring-blue-500/40'
                          : 'bg-gray-900/40 border-gray-800/80 hover:bg-gray-800/50 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white tracking-wide">{post.file_number}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            post.priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : post.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {post.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 line-clamp-2 font-medium">{post.plain_title}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="capitalize">{post.platform}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Post Review Panel */}
          {selectedPost ? (
            <div className="flex-1 flex flex-col overflow-y-auto bg-[#111827] p-5">
              
              {/* Top Overview */}
              <div className="bg-[#1A2234] rounded-xl p-4 border border-gray-800 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-blue-400">{selectedPost.file_number}</span>
                  {selectedPost.fiscal_amount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Fiscal Allocation: {formatCurrency(selectedPost.fiscal_amount)}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{selectedPost.plain_title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">{selectedPost.the_what}</p>
                <p className="text-xs text-amber-200/90 font-medium">Target: {selectedPost.the_who}</p>
              </div>

              {/* Receipt Verification Box */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Receipt Verification Protocol Citation (Page {selectedPost.receipt_page})</span>
                  </div>
                  <a
                    href={selectedPost.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-200 text-xs flex items-center gap-1 font-semibold"
                  >
                    Official Clerk URL <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <blockquote className="text-xs text-gray-300 italic border-l-2 border-emerald-500/60 pl-2.5 py-0.5">
                  &ldquo;{selectedPost.receipt_snippet}&rdquo;
                </blockquote>
              </div>

              {/* Platform Previews & Visual Card Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                {(['twitter', 'bluesky', 'mastodon', 'webhook'] as PlatformTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePlatformTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      activePlatformTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    {tab} Preview
                  </button>
                ))}
              </div>

              {/* Thread Content */}
              <div className="space-y-3 mb-4">
                {selectedPost.thread_content.map((tweet, idx) => (
                  <div key={idx} className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-1 text-[11px] text-gray-400">
                      <span>Post {idx + 1} of {selectedPost.thread_content.length}</span>
                      <span>{tweet.length} / 280 chars</span>
                    </div>
                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{tweet}</p>
                  </div>
                ))}
              </div>

              {/* Roll-Call Floor Vote Override Section */}
              <div className="mb-4">
                <button
                  onClick={() => setIsRollCallOpen(!isRollCallOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white mb-2"
                >
                  <Vote className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isRollCallOpen ? 'Hide' : 'Log'} Floor Roll-Call Vote Override (Legistar Gaps)</span>
                </button>

                {isRollCallOpen && (
                  <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 space-y-2 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Council Floor Action</label>
                      <select
                        value={rollCallAction}
                        onChange={(e) => setRollCallAction(e.target.value)}
                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 text-xs"
                      >
                        <option value="Passed">Passed (Approved)</option>
                        <option value="Failed">Failed (Rejected)</option>
                        <option value="Tabled">Tabled / Deferred</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Recorded Ayes (comma-separated)</label>
                      <input
                        type="text"
                        value={rollCallAyes}
                        onChange={(e) => setRollCallAyes(e.target.value)}
                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Audit Verification Notes</label>
                      <input
                        type="text"
                        value={rollCallNotes}
                        onChange={(e) => setRollCallNotes(e.target.value)}
                        placeholder="Verified via official meeting video archive timestamp..."
                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 text-xs"
                      />
                    </div>
                    <button
                      onClick={handleSaveRollCall}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                    >
                      Save Roll-Call Override
                    </button>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-auto pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                {showRejectInput ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason for audit log..."
                      className="flex-1 bg-gray-900 text-white text-xs p-2.5 rounded-lg border border-rose-500/50"
                    />
                    <button
                      onClick={handleReject}
                      disabled={isLoading || !rejectReason.trim()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-2 text-gray-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="px-4 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Post</span>
                    </button>

                    <button
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Dispatch to Queue</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-gray-500 text-sm">
              Select a pending matter to begin moderation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
