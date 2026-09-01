/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  DollarSign, 
  Users, 
  FileText, 
  ShieldCheck, 
  Scale, 
  CheckCircle2, 
  Clock, 
  Tag, 
  ArrowRight,
  Layers,
  Share2
} from 'lucide-react';
import { OCDBill } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface DocketCardProps {
  bill: OCDBill;
  onViewReceipt: (bill: OCDBill) => void;
  onViewPerspectives: (bill: OCDBill) => void;
  onShareBill?: (bill: OCDBill) => void;
  onSelectTag?: (tag: string) => void;
}

export const DocketCard: React.FC<DocketCardProps> = ({
  bill,
  onViewReceipt,
  onViewPerspectives,
  onShareBill,
  onSelectTag,
}) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Zoning & Housing':
        return 'bg-[#1A1A1A] text-white';
      case 'Infrastructure & Public Works':
        return 'bg-[#2D6A4F] text-white';
      case 'Environment & Parks':
        return 'bg-[#2B4162] text-white';
      case 'Public Safety':
        return 'bg-[#E63946] text-white';
      case 'Budget & Finance':
        return 'bg-[#6D597A] text-white';
      default:
        return 'bg-[#1A1A1A] text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Passed':
      case 'Enacted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2D6A4F] text-white">
            <CheckCircle2 className="w-3 h-3" />
            {status}
          </span>
        );
      case 'In Committee':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30">
            <Clock className="w-3 h-3 text-[#1A1A1A]" />
            In Committee
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F2F0EA] text-[#555] border border-[#1A1A1A]/20">
            {status}
          </span>
        );
    }
  };

  return (
    <article className="bg-[#FDFDFC] border border-[#1A1A1A]/20 hover:border-[#1A1A1A] transition-all duration-150 p-5 sm:p-6 flex flex-col justify-between group shadow-xs">
      <div>
        {/* Header Badges & File Number */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1A1A1A]/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 font-mono ${getCategoryBadge(bill.category)}`}>
              {bill.category}
            </span>
            <span className="text-xs font-mono font-bold text-[#777]">
              {bill.fileNumber}
            </span>
            {bill.isConsentCalendar && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30 px-1.5 py-0.2 flex items-center gap-1" title="Approved on bulk consent calendar without standalone debate">
                <Layers className="w-2.5 h-2.5" />
                Consent Agenda
              </span>
            )}
          </div>
          <div>{getStatusBadge(bill.status)}</div>
        </div>

        {/* Plain Language Headline */}
        <h3 className="text-xl sm:text-2xl font-serif leading-snug font-medium text-[#1A1A1A] group-hover:italic transition-all">
          {bill.plainTitle}
        </h3>

        {/* Raw Legalese Subtitle */}
        <div className="text-[11px] font-mono text-[#777] mt-1 mb-3 line-clamp-1 border-b border-[#1A1A1A]/10 pb-2">
          {bill.title}
        </div>

        {/* What it does in plain language */}
        <p className="text-xs sm:text-sm text-[#444] leading-relaxed mb-4 font-sans">
          {bill.summary}
        </p>

        {/* Impact & Fiscal Note Box */}
        <div className="space-y-2 bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/10 text-xs mb-4">
          {/* Who it affects */}
          <div className="flex items-start gap-2 text-[#333]">
            <Users className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1A1A1A]">Who it affects: </span>
              <span>{bill.whoItAffects}</span>
            </div>
          </div>

          {/* Fiscal Impact */}
          <div className="flex items-start gap-2 text-[#333]">
            <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1A1A1A]">Fiscal Impact: </span>
              {bill.fiscalImpact.amount > 0 ? (
                <span className="font-bold font-mono text-[#2D6A4F]">
                  {formatCurrency(bill.fiscalImpact.amount)}
                </span>
              ) : (
                <span className="text-[#555]">Regulatory / $0 Direct Outlay</span>
              )}
              <span className="text-[#777] ml-1">({bill.fiscalImpact.fundingSource})</span>
            </div>
          </div>
        </div>

        {/* Voting Summary if available */}
        {bill.votes && (
          <div className="flex items-center justify-between text-xs text-[#1A1A1A] bg-[#F2F0EA] px-3 py-1.5 border border-[#1A1A1A]/20 mb-4 font-mono">
            <span className="font-bold">
              Roll Call: {bill.votes.yesCount} Aye / {bill.votes.noCount} Nay
            </span>
            <span className="text-[#777]">{formatDate(bill.votes.date)}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {bill.tags.map((t) => (
            <button
              key={t}
              onClick={() => onSelectTag?.(t)}
              className="text-[10px] uppercase font-bold tracking-wider text-[#555] bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-[#FDFDFC] border border-[#1A1A1A]/15 px-2 py-0.5 transition-colors flex items-center gap-1"
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#1A1A1A]/15 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Receipt Check Trigger */}
          <button
            onClick={() => onViewReceipt(bill)}
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 px-2.5 sm:px-3 py-1.5 transition-colors text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>Receipt Check</span>
          </button>

          {/* Social Broadcast Trigger */}
          {onShareBill && (
            <button
              onClick={() => onShareBill(bill)}
              title="Broadcast to Social Media (X, Bluesky, Threads, LinkedIn, Instagram)"
              className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 px-2 sm:px-2.5 py-1.5 transition-colors text-[11px]"
            >
              <Share2 className="w-3.5 h-3.5 text-[#E63946]" />
              <span className="hidden sm:inline">Broadcast</span>
            </button>
          )}
        </div>

        {/* Multi-Perspective Analysis Trigger */}
        <button
          onClick={() => onViewPerspectives(bill)}
          className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[#FDFDFC] bg-[#1A1A1A] hover:bg-[#333] px-3 py-1.5 transition-colors text-[11px]"
        >
          <Scale className="w-3 h-3 text-[#FDFDFC]" />
          <span>Perspectives</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
};

