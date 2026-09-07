/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  DollarSign, 
  Sliders, 
  UserCheck, 
  Send, 
  TrendingUp, 
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { OCDBill, OCDJurisdiction } from '../types';

interface ResidentMicroSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBill?: OCDBill | null;
  jurisdiction: OCDJurisdiction;
  onSurveySubmitted?: (data: any) => void;
}

export const ResidentMicroSurveyModal: React.FC<ResidentMicroSurveyModalProps> = ({
  isOpen,
  onClose,
  targetBill,
  jurisdiction,
  onSurveySubmitted,
}) => {
  // Form Inputs
  const [selectedWard, setSelectedWard] = useState<string>(
    jurisdiction.divisions[0]?.id || 'ocd-division/country:us/state:oh/place:cleveland/ward:12'
  );
  const [residentRole, setResidentRole] = useState<'homeowner' | 'renter' | 'small_business' | 'commuter' | 'student' | 'general'>('homeowner');
  const [stance, setStance] = useState<'support' | 'oppose' | 'amend' | 'neutral'>('support');
  const [costImpact, setCostImpact] = useState<number>(0);
  const [priorityRating, setPriorityRating] = useState<number>(8);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [epsilon, setEpsilon] = useState<number>(1.0);

  // States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [aggregates, setAggregates] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'vote' | 'community_pulse'>('vote');
  const [showPrivacyDetail, setShowPrivacyDetail] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSubmittedResult(null);
      setActiveTab('vote');
      // Fetch initial community stats
      const billParam = targetBill ? `?billId=${encodeURIComponent(targetBill.id)}` : '';
      fetch(`/api/sentiment/microsurvey-stats${billParam}`)
        .then((res) => res.json())
        .then((data) => setAggregates(data))
        .catch(() => {});
    }
  }, [isOpen, targetBill]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const wardNumberMatch = selectedWard.match(/ward:(\d+)/);
    const wardNumber = wardNumberMatch ? parseInt(wardNumberMatch[1], 10) : 12;

    const payload = {
      billId: targetBill ? targetBill.id : 'general-municipal',
      billTitle: targetBill ? targetBill.plainTitle : `${jurisdiction.name} Municipal Agenda`,
      divisionId: selectedWard,
      wardNumber,
      residentRole,
      stance,
      perceivedCostImpactUSD: costImpact,
      priorityRating,
      anonymizedFeedback: feedbackText,
      epsilon,
    };

    try {
      const response = await fetch('/api/sentiment/submit-microsurvey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setSubmittedResult(data);
        setAggregates(data.aggregated);
        setActiveTab('community_pulse');
        onSurveySubmitted?.(data);
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFDFC] max-w-2xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Masthead */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#2D6A4F] text-white">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white flex items-center gap-2">
                Resident Voice &amp; Micro-Survey
                <span className="text-[10px] text-white font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-[#E63946]">
                  Zero-Party Input
                </span>
              </h3>
              <p className="text-[11px] text-[#aaa] font-sans">
                Non-partisan constituent pulse protected with ε-Differential Privacy
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

        {/* Target Docket Banner if present */}
        {targetBill ? (
          <div className="bg-[#F2F0EA] border-b border-[#1A1A1A]/20 px-6 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-white bg-[#1A1A1A] px-2 py-0.5">
                {targetBill.fileNumber}
              </span>
              <span className="text-xs font-mono font-bold uppercase text-[#555]">
                {targetBill.category}
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#1A1A1A] line-clamp-1">
              {targetBill.plainTitle}
            </h4>
          </div>
        ) : (
          <div className="bg-[#F2F0EA] border-b border-[#1A1A1A]/20 px-6 py-2 text-xs font-mono text-[#555] flex items-center justify-between">
            <span>Jurisdiction: <strong className="text-[#1A1A1A]">{jurisdiction.name}</strong></span>
            <span>All Wards Citywide</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="bg-[#E5E2D9] px-6 py-2 flex items-center justify-between border-b border-[#1A1A1A]/15 text-xs font-mono font-bold uppercase">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('vote')}
              className={`px-3 py-1 transition-colors ${activeTab === 'vote' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'}`}
            >
              Cast Constituent Vote
            </button>
            <button
              onClick={() => setActiveTab('community_pulse')}
              className={`px-3 py-1 transition-colors ${activeTab === 'community_pulse' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'}`}
            >
              Community Pulse {aggregates?.totalVotes ? `(${aggregates.totalVotes})` : ''}
            </button>
          </div>

          <button
            onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
            className="text-[11px] text-[#2D6A4F] hover:underline flex items-center gap-1 normal-case font-sans"
          >
            <Lock className="w-3 h-3" />
            <span>Differential Privacy (ε={epsilon.toFixed(1)})</span>
          </button>
        </div>

        {/* Privacy Formula Banner (collapsible) */}
        {showPrivacyDetail && (
          <div className="bg-[#2D6A4F]/10 border-b border-[#2D6A4F]/30 p-4 text-xs space-y-2 text-[#1B4332] animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 font-bold font-mono text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>Laplace Differential Privacy Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your response is perturbated mathematically using Laplace noise: 
              <code className="bg-white/80 px-1 py-0.5 font-mono ml-1">M(D) = f(D) + Laplace(Δf / ε)</code>. 
              Even if a bad actor had access to the full survey database, they cannot determine your individual vote with statistical certainty.
            </p>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span>Sensitivity bound: <strong>Δf = $50.00</strong></span>
              <span>Privacy parameter: <strong>ε = {epsilon}</strong></span>
              <span>Scale parameter: <strong>b = {(50 / epsilon).toFixed(1)}</strong></span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'vote' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Question 1: Legislative Stance */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#555] mb-2">
                  1. What is your stance on this municipal action?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'support', label: 'Support (Aye)', color: 'border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/5' },
                    { key: 'oppose', label: 'Oppose (Nay)', color: 'border-[#E63946] text-[#E63946] bg-[#E63946]/5' },
                    { key: 'amend', label: 'Needs Amendment', color: 'border-[#E76F51] text-[#E76F51] bg-[#E76F51]/5' },
                    { key: 'neutral', label: 'Neutral / Undecided', color: 'border-[#666] text-[#666] bg-[#f0f0f0]' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setStance(opt.key as any)}
                      className={`p-3 border-2 text-center text-xs font-bold uppercase tracking-wider transition-all ${
                        stance === opt.key 
                          ? `${opt.color} ring-2 ring-[#1A1A1A] font-black` 
                          : 'border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#555]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Ward & Resident Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#555] mb-1.5">
                    2. Your Ward / Division:
                  </label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full bg-[#FDFDFC] border border-[#1A1A1A] p-2 text-xs font-serif font-bold text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  >
                    {jurisdiction.divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name} {div.population ? `(~${(div.population / 1000).toFixed(0)}k pop)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#555] mb-1.5">
                    3. Resident Profile:
                  </label>
                  <select
                    value={residentRole}
                    onChange={(e) => setResidentRole(e.target.value as any)}
                    className="w-full bg-[#FDFDFC] border border-[#1A1A1A] p-2 text-xs font-serif font-bold text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  >
                    <option value="homeowner">Homeowner / Property Owner</option>
                    <option value="renter">Renter / Tenant</option>
                    <option value="small_business">Local Small Business Owner</option>
                    <option value="commuter">Transit Rider / Daily Commuter</option>
                    <option value="student">Student / Youth Resident</option>
                    <option value="general">General Resident</option>
                  </select>
                </div>
              </div>

              {/* Question 3: Perceived Household Cost/Savings Impact Slider */}
              <div className="p-4 bg-[#F2F0EA] border border-[#1A1A1A]/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold uppercase text-[#555]">
                    4. Estimated Monthly Household Impact:
                  </span>
                  <span className={`font-bold px-2 py-0.5 text-xs ${costImpact < 0 ? 'bg-[#2D6A4F] text-white' : costImpact > 0 ? 'bg-[#E63946] text-white' : 'bg-[#1A1A1A] text-white'}`}>
                    {costImpact < 0 ? `-$${Math.abs(costImpact)}/mo (Savings)` : costImpact > 0 ? `+$${costImpact}/mo (Increased Cost)` : '$0 (Neutral Impact)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="10"
                  value={costImpact}
                  onChange={(e) => setCostImpact(Number(e.target.value))}
                  className="w-full accent-[#1A1A1A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#777]">
                  <span>-$200/mo (High Savings)</span>
                  <span>$0 (Neutral)</span>
                  <span>+$200/mo (Cost Increase)</span>
                </div>
              </div>

              {/* Question 4: Urgency / Priority Rating (1-10) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold uppercase text-[#555]">
                    5. Neighborhood Urgency / Priority (1 to 10):
                  </span>
                  <span className="font-bold text-[#1A1A1A] text-xs font-mono bg-[#E5E2D9] px-2 py-0.5 border border-[#1A1A1A]/20">
                    {priorityRating} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={priorityRating}
                  onChange={(e) => setPriorityRating(Number(e.target.value))}
                  className="w-full accent-[#2D6A4F] cursor-pointer"
                />
              </div>

              {/* Question 5: Anonymous Statement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#555] mb-1">
                  6. Optional Anonymous Feedback (max 180 chars):
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value.slice(0, 180))}
                  placeholder="e.g. Flooding has damaged Fleet Ave basements every spring. We need storm basin expansion now."
                  rows={2}
                  className="w-full bg-[#FDFDFC] border border-[#1A1A1A] p-2.5 text-xs font-sans text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] placeholder:text-[#888]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#777] mt-1">
                  <span>Anonymized and stripped of IP/identifying metadata</span>
                  <span>{180 - feedbackText.length} chars remaining</span>
                </div>
              </div>

              {/* Privacy Loss Parameter Slider */}
              <div className="pt-2 border-t border-[#1A1A1A]/15 flex items-center justify-between gap-4 text-xs font-mono">
                <span className="text-[#666] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  Privacy Budget (ε):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={epsilon}
                    onChange={(e) => setEpsilon(Number(e.target.value))}
                    className="w-24 accent-[#2D6A4F]"
                  />
                  <span className="font-bold text-[#1A1A1A]">{epsilon.toFixed(1)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white p-3 text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Injecting Laplace Noise &amp; Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Submit Anonymized Constituent Vote</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB: Community Pulse & Results */}
          {activeTab === 'community_pulse' && aggregates && (
            <div className="space-y-5">
              
              {/* Receipt of submission if just submitted */}
              {submittedResult && (
                <div className="bg-[#2D6A4F]/10 border-2 border-[#2D6A4F] p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#2D6A4F] font-mono font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vote Registered &amp; Differentially Privatized!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#1B4332] pt-1 border-t border-[#2D6A4F]/20">
                    <div>Your Raw Cost Input: <strong>${submittedResult.submission.rawCostImpactUSD}/mo</strong></div>
                    <div>DP Perturbed Value: <strong>${submittedResult.submission.dpCostImpactUSD}/mo</strong></div>
                    <div>Laplace Noise Added: <strong>{submittedResult.submission.costNoiseAdded > 0 ? `+` : ''}{submittedResult.submission.costNoiseAdded}</strong></div>
                    <div>Privacy Parameter: <strong>ε = {submittedResult.submission.epsilon}</strong></div>
                  </div>
                </div>
              )}

              {/* Community Pulse Breakdown */}
              <div className="border border-[#1A1A1A] p-4 bg-[#FDFDFC] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Constituent Stance Breakdown
                  </span>
                  <span className="font-mono text-xs font-bold text-[#555]">
                    {aggregates.totalVotes} Total Verified Responses
                  </span>
                </div>

                {/* Stance Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-4 w-full flex overflow-hidden border border-[#1A1A1A]/20">
                    <div style={{ width: `${aggregates.supportPct}%` }} className="bg-[#2D6A4F] h-full" title={`Support: ${aggregates.supportPct}%`} />
                    <div style={{ width: `${aggregates.opposePct}%` }} className="bg-[#E63946] h-full" title={`Oppose: ${aggregates.opposePct}%`} />
                    <div style={{ width: `${aggregates.amendPct}%` }} className="bg-[#E76F51] h-full" title={`Needs Amendment: ${aggregates.amendPct}%`} />
                    <div style={{ width: `${aggregates.neutralPct}%` }} className="bg-[#999] h-full" title={`Neutral: ${aggregates.neutralPct}%`} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 pt-1">
                    <span className="flex items-center gap-1 text-[#2D6A4F] font-bold">
                      <span className="w-2.5 h-2.5 bg-[#2D6A4F] inline-block" />
                      Support {aggregates.supportPct}%
                    </span>
                    <span className="flex items-center gap-1 text-[#E63946] font-bold">
                      <span className="w-2.5 h-2.5 bg-[#E63946] inline-block" />
                      Oppose {aggregates.opposePct}%
                    </span>
                    <span className="flex items-center gap-1 text-[#E76F51] font-bold">
                      <span className="w-2.5 h-2.5 bg-[#E76F51] inline-block" />
                      Amend {aggregates.amendPct}%
                    </span>
                    <span className="flex items-center gap-1 text-[#666] font-bold">
                      <span className="w-2.5 h-2.5 bg-[#999] inline-block" />
                      Neutral {aggregates.neutralPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Economic & Priority Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <div className="text-[10px] font-mono uppercase text-[#777] mb-1">
                    Avg. Household Cost Impact (DP):
                  </div>
                  <div className="text-xl font-serif font-bold text-[#1A1A1A]">
                    {aggregates.dpAvgCostImpactUSD < 0 
                      ? `-$${Math.abs(aggregates.dpAvgCostImpactUSD).toFixed(1)}/mo` 
                      : `+$${aggregates.dpAvgCostImpactUSD.toFixed(1)}/mo`}
                  </div>
                  <div className="text-[10px] font-mono text-[#666] mt-1">
                    Differential privacy Laplace estimation
                  </div>
                </div>

                <div className="p-4 bg-[#F2F0EA] border border-[#1A1A1A]/20">
                  <div className="text-[10px] font-mono uppercase text-[#777] mb-1">
                    Constituent Urgency Score:
                  </div>
                  <div className="text-xl font-serif font-bold text-[#1A1A1A]">
                    {aggregates.dpAvgPriority.toFixed(1)} <span className="text-sm font-sans font-normal text-[#666]">/ 10</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#666] mt-1">
                    Average priority across ward respondents
                  </div>
                </div>
              </div>

              {/* Sample Anonymous Constituent Quotes */}
              {aggregates.sampleStatements && aggregates.sampleStatements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#555] block">
                    Recent Anonymous Resident Testimony:
                  </span>
                  <div className="space-y-2">
                    {aggregates.sampleStatements.map((stmt: string, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FDFDFC] border border-[#1A1A1A]/20 text-xs italic font-serif text-[#333]">
                        &ldquo;{stmt}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('vote')}
                className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white p-2.5 text-xs font-bold uppercase tracking-wider font-mono transition-colors"
              >
                Change or Update My Vote
              </button>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F2F0EA] px-6 py-3 border-t border-[#1A1A1A]/15 flex items-center justify-between text-xs font-mono">
          <span className="text-[#666] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
            <span>Zero-Party Feedback Pipeline</span>
          </span>
          <button
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-1.5 font-bold uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
