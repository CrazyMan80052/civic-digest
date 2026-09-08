/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Newspaper, 
  MessageSquare, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  CheckCircle2, 
  RefreshCw,
  EyeOff
} from 'lucide-react';
import { OCDBill } from '../types';

interface MultiPerspectiveViewProps {
  bills: OCDBill[];
  selectedBillId?: string;
  onSelectBill: (billId: string) => void;
  onOpenReceipt: (bill: OCDBill) => void;
}

export const MultiPerspectiveView: React.FC<MultiPerspectiveViewProps> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onOpenReceipt,
}) => {
  const currentBill = bills.find((b) => b.id === selectedBillId) || bills[0];
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPerspectives, setCustomPerspectives] = useState<any>(null);

  const perspectives = customPerspectives || currentBill?.perspectives;

  const handleGenerateFreshAnalysis = async () => {
    if (!currentBill) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/multi-perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billTitle: currentBill.plainTitle,
          plainSummary: currentBill.summary,
          jurisdiction: 'Cleveland City Council',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomPerspectives(data);
      }
    } catch (err) {
      console.error('Failed to regenerate perspective:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBiasBadge = (bias: string) => {
    switch (bias) {
      case 'Left':
        return 'bg-[#2B4162] text-white';
      case 'Center':
        return 'bg-[#1A1A1A] text-white';
      case 'Right':
        return 'bg-[#E63946] text-white';
      case 'Business-focused':
        return 'bg-[#2D6A4F] text-white';
      default:
        return 'bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30';
    }
  };

  if (!currentBill) {
    return (
      <div className="text-center py-12 text-[#777] font-serif">
        No active legislative dockets found.
      </div>
    );
  }

  const { supportPercentage, opposePercentage, neutralPercentage } =
    perspectives.publicCommentBreakdown;

  return (
    <div className="space-y-6">
      {/* Top Banner / Masthead Section */}
      <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 bg-[#1A1A1A] text-[#FDFDFC]">
                <Scale className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">
                The Policy Spectrum &amp; 360° Perspectives
              </h2>
              <span className="text-xs bg-[#F2F0EA] border border-[#1A1A1A]/30 text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
                {currentBill.fileNumber}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-3xl font-sans leading-relaxed">
              Triangulating municipal policy across three distinct pillars of record: official sponsor filings, local investigative media reporting, and grassroots citizen testimonies.
            </p>
          </div>

          {/* Bill Picker Dropdown & Re-analyze trigger */}
          <div className="flex items-center gap-2.5">
            <select
              id="multi-perspective-bill-selector"
              aria-label="Select municipal docket for multi-perspective analysis"
              value={currentBill.id}
              onChange={(e) => {
                setCustomPerspectives(null);
                onSelectBill(e.target.value);
              }}
              className="bg-[#F2F0EA] border border-[#1A1A1A]/30 text-[#1A1A1A] text-xs font-bold py-2 px-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A] max-w-xs truncate cursor-pointer"
            >
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fileNumber}: {b.plainTitle}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateFreshAnalysis}
              disabled={isGenerating}
              aria-label="Generate fresh multi-perspective analysis with Gemini AI"
              className="inline-flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] text-xs font-bold uppercase tracking-wider px-3.5 py-2 transition-colors disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
                  <span>AI Re-Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Policy Banner */}
        <div className="mt-4 pt-4 border-t border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest block font-mono">
              Active Matter Under Review
            </span>
            <span className="text-lg sm:text-xl font-serif text-[#1A1A1A] font-medium">
              {currentBill.plainTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenReceipt(currentBill)}
            aria-label={`Open primary source receipt for ${currentBill.fileNumber}`}
            className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 px-3 py-1.5 flex items-center gap-1 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
            <span>Primary Source Receipt</span>
          </button>
        </div>
      </div>

      {/* Media Perspective & Blindspot Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coverage Bias Distribution */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#1A1A1A]/20 pb-2 mb-2 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
              Media Coverage Diversity
            </h3>
            <p className="text-xs text-[#4B5563] mb-3">
              Spectrum of journalism outlets reporting on this council docket
            </p>

            {/* Bias Meter Bar */}
            <div className="h-3.5 w-full overflow-hidden flex bg-[#F2F0EA] border border-[#1A1A1A]/20 mb-3">
              <div
                style={{ width: '35%' }}
                className="bg-[#2B4162] h-full"
                title="Grassroots / Neighborhood (35%)"
              />
              <div
                style={{ width: '40%' }}
                className="bg-[#1A1A1A] h-full"
                title="Major Daily Record (40%)"
              />
              <div
                style={{ width: '25%' }}
                className="bg-[#2D6A4F] h-full"
                title="Business & Commercial (25%)"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#2B4162] inline-block" />
                Grassroots (35%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#1A1A1A] inline-block" />
                Major Daily (40%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#2D6A4F] inline-block" />
                Business (25%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 text-[11px] text-[#525252] font-mono">
            <span className="font-bold text-[#1A1A1A]">Sources:</span> Signal Cleveland, The Plain Dealer, Cleveland Scene, Crain's.
          </div>
        </div>

        {/* Resident Public Comment Sentiment */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#1A1A1A]/20 pb-2 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
              Public Testimony Sentiment
            </h3>
            <p className="text-xs text-[#4B5563] mb-3">
              Synthesized from {perspectives.publicCommentBreakdown.totalComments} verified public hearing records
            </p>

            {/* Support vs Oppose Bar */}
            <div className="h-3.5 w-full overflow-hidden flex bg-[#F2F0EA] border border-[#1A1A1A]/20 mb-3">
              <div
                style={{ width: `${supportPercentage}%` }}
                className="bg-[#2D6A4F] h-full"
                title={`Support (${supportPercentage}%)`}
              />
              <div
                style={{ width: `${neutralPercentage}%` }}
                className="bg-[#525252] h-full"
                title={`Neutral (${neutralPercentage}%)`}
              />
              <div
                style={{ width: `${opposePercentage}%` }}
                className="bg-[#E63946] h-full"
                title={`Oppose (${opposePercentage}%)`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#2D6A4F] flex items-center gap-1 font-mono">
                <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                {supportPercentage}% Support
              </span>
              <span className="text-[#525252] flex items-center gap-1 font-mono">
                <Minus className="w-3 h-3" aria-hidden="true" />
                {neutralPercentage}% Neutral
              </span>
              <span className="text-[#E63946] flex items-center gap-1 font-mono">
                <ThumbsDown className="w-3 h-3" aria-hidden="true" />
                {opposePercentage}% Oppose
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 text-[11px] text-[#525252] font-mono">
            <span className="font-bold text-[#1A1A1A]">Audit:</span> Official City Clerk Public Hearing Transcripts.
          </div>
        </div>

        {/* Blindspot Analysis */}
        <div className="bg-[#F2F0EA] border border-[#1A1A1A]/20 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#1A1A1A]/20 pb-2 mb-2 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
              Editorial Blindspot Alert
            </h3>
            <p className="text-xs text-[#333] font-serif italic leading-relaxed">
              "{perspectives.blindspotSummary ||
                'Mainstream media outlets focused on overall budget totals, while neighborhood testimonies focused on traffic detours and local minority business subcontractor participation.'}"
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1A1A1A]/15 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#525252]">
            <AlertCircle className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
            <span>CivicDigest NLP Triangulation</span>
          </div>
        </div>

      </div>

      {/* 3 Pillars of Perspective: Official vs Media vs Community */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pillar 1: Official Docket Stance */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-2 border-b-2 border-[#1A1A1A] flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                1. Official Filing Stance
              </h4>
              <span className="text-[10px] font-mono text-[#525252]">The Docket</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest block mb-1 font-mono">
                Sponsor Intent
              </span>
              <p className="text-xs text-[#333] leading-relaxed bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
                {perspectives.officialDocketStance.sponsorIntent}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest block mb-1 font-mono">
                Legal Department Counsel
              </span>
              <p className="text-xs text-[#333] leading-relaxed bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
                {perspectives.officialDocketStance.legalDepartmentNote}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest block mb-1 font-mono">
                Fiscal Auditor Review
              </span>
              <p className="text-xs text-[#333] leading-relaxed bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
                {perspectives.officialDocketStance.fiscalReviewNote}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Local Media Perspectives */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-2 border-b-2 border-[#1A1A1A] flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" aria-hidden="true" />
                2. Press &amp; Media Coverage
              </h4>
              <span className="text-[10px] font-mono text-[#525252]">The Newsroom</span>
            </div>

            <div className="space-y-3">
              {perspectives.mediaPerspectives.map((article: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[#1A1A1A] truncate font-serif">
                      {article.sourceName}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 ${getBiasBadge(article.biasRating)}`}>
                      {article.biasRating}
                    </span>
                  </div>

                  <h5 className="text-xs font-serif font-medium text-[#1A1A1A] leading-snug">
                    "{article.headline}"
                  </h5>

                  <p className="text-[11px] text-[#4B5563] leading-relaxed font-sans">
                    {article.summary}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[#525252] border-t border-[#1A1A1A]/10">
                    <span className="font-bold text-[#1A1A1A]">Stance: {article.keyStance}</span>
                    {article.articleUrl && article.articleUrl !== '#' && (
                      <a
                        href={article.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Read article "${article.headline}" from ${article.sourceName} (opens in new tab)`}
                        className="hover:text-[#1A1A1A] flex items-center gap-0.5 uppercase font-bold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                      >
                        Article <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 3: Resident Public Comment Quotes */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-2 border-b-2 border-[#1A1A1A] flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                3. Resident Testimonies
              </h4>
              <span className="text-[10px] font-mono text-[#525252]">Public Record</span>
            </div>

            <div className="space-y-3">
              {perspectives.publicCommentBreakdown.topResidentThemes.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1A1A]">
                      {item.theme}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                        item.sentiment === 'pro'
                          ? 'bg-[#2D6A4F] text-white'
                          : item.sentiment === 'con'
                          ? 'bg-[#E63946] text-white'
                          : 'bg-[#1A1A1A] text-white'
                      }`}
                    >
                      {item.sentiment === 'pro' ? 'Pro-Measure' : item.sentiment === 'con' ? 'Concern' : 'Neutral'}
                    </span>
                  </div>

                  <p className="text-xs font-serif italic text-[#1A1A1A] leading-relaxed bg-[#FDFDFC] p-2.5 border border-[#1A1A1A]/10">
                    "{item.quoteSample}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

