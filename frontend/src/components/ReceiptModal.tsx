/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ExternalLink, FileText, CheckCircle2, Copy, X } from 'lucide-react';
import { ReceiptCitation } from '../types';

interface ReceiptModalProps {
  receipt: ReceiptCitation | null;
  billTitle: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, billTitle, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!receipt) return null;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(
      `Citation: ${receipt.documentTitle} (File: ${receipt.fileNumber}, Page ${receipt.pageNumber || 1}) - "${receipt.paragraphSnippet}"`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFDFC] max-w-2xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white flex items-center gap-2">
                Official Primary Source Citation
                <span className="text-[10px] bg-[#E63946] text-white font-mono font-bold uppercase tracking-wider px-2 py-0.5">
                  {receipt.verificationBadge}
                </span>
              </h3>
              <p className="text-[11px] text-[#aaa] font-sans">
                Directly grounded in official municipal clerks' records &amp; journals
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#1A1A1A]">
          
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#777] font-mono block">
              Legislative Matter Title
            </span>
            <p className="text-base font-serif font-bold text-[#1A1A1A] mt-0.5">{billTitle}</p>
          </div>

          {/* Key Identifiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F2F0EA] p-4 border border-[#1A1A1A]/15 text-xs font-mono">
            <div>
              <span className="text-[#777] text-[10px] uppercase font-bold tracking-wider block">File Number</span>
              <span className="font-bold text-[#1A1A1A] text-sm">{receipt.fileNumber}</span>
            </div>
            <div>
              <span className="text-[#777] text-[10px] uppercase font-bold tracking-wider block">Clerk Matter ID</span>
              <span className="font-bold text-[#1A1A1A] text-sm">{receipt.clerkMatterId}</span>
            </div>
            <div>
              <span className="text-[#777] text-[10px] uppercase font-bold tracking-wider block">Page Reference</span>
              <span className="font-bold text-[#1A1A1A] text-sm">Page {receipt.pageNumber || 'N/A'}</span>
            </div>
          </div>

          {/* Verifiable Text Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#777] flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-[#1A1A1A]" />
                Verifiable Legal Excerpt
              </span>
              <button
                onClick={handleCopyCitation}
                className="text-xs text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 px-2 py-0.5 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors font-mono text-[10px]"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Citation
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#F2F0EA] border-l-4 border-[#1A1A1A] p-4 text-xs sm:text-sm font-serif leading-relaxed text-[#1A1A1A] italic">
              "{receipt.paragraphSnippet}"
            </div>
          </div>

          {/* Audit & Provenance Details */}
          <div className="space-y-2 text-xs text-[#555] border-t border-[#1A1A1A]/10 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[#777]">Source Archive Document:</span>
              <span className="font-bold text-[#1A1A1A]">{receipt.documentTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#777]">Last Clerk Sync / Audit:</span>
              <span className="font-mono text-[#1A1A1A]">
                {new Date(receipt.verifiedAt).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#F2F0EA] px-6 py-4 border-t border-[#1A1A1A]/15 flex items-center justify-between">
          <p className="text-[11px] text-[#777] font-mono">
            Open Civic Data (OCD-ID) Standard
          </p>
          <a
            href={receipt.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors"
          >
            <span>Open Legistar Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};

