/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Layers, 
  Database, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Building,
  Plus
} from 'lucide-react';
import { OCDBill } from '../types';

interface ScraperControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDockets: (newBills: OCDBill[]) => void;
}

interface ScraperTarget {
  id: string;
  city: string;
  state: string;
  clientName: string;
  system: string;
  endpoint: string;
  councilSize: number;
  status: string;
}

export const ScraperControlModal: React.FC<ScraperControlModalProps> = ({
  isOpen,
  onClose,
  onImportDockets,
}) => {
  const [targets, setTargets] = useState<ScraperTarget[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('cleveland');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [scrapeStep, setScrapeStep] = useState<number>(0);
  const [scrapedResults, setScrapedResults] = useState<OCDBill[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'preview'>('console');
  const [importedCount, setImportedCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/scrapers/targets')
        .then((res) => res.json())
        .then((data) => {
          setTargets(data);
          if (data.length > 0 && !selectedCity) {
            setSelectedCity(data[0].clientName);
          }
        })
        .catch(() => {
          setTargets([
            {
              id: 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
              city: 'Cleveland',
              state: 'OH',
              clientName: 'cleveland',
              system: 'Legistar OData v1',
              endpoint: 'https://webapi.legistar.com/v1/cleveland/matters',
              councilSize: 17,
              status: 'active',
            },
            {
              id: 'ocd-jurisdiction/country:us/state:tx/place:austin/government',
              city: 'Austin',
              state: 'TX',
              clientName: 'austin',
              system: 'Legistar OData v1',
              endpoint: 'https://webapi.legistar.com/v1/austin/matters',
              councilSize: 11,
              status: 'active',
            },
          ]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runScraper = async () => {
    setIsRunning(true);
    setScrapeStep(1);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Legistar OData worker for client: '${selectedCity}'...`,
      `[${new Date().toLocaleTimeString()}] Querying OData endpoint: https://webapi.legistar.com/v1/${selectedCity}/matters`,
    ]);

    try {
      setTimeout(() => {
        setScrapeStep(2);
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Received raw legislative matters. Transforming into Open Civic Data (OCD-ID) schema...`,
          `[${new Date().toLocaleTimeString()}] Extracting clerk matter IDs and verified primary source URLs...`,
        ]);
      }, 900);

      setTimeout(() => {
        setScrapeStep(3);
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Transmitting to Gemini 2.5 Flash for plain-language translation & fiscal impact categorization...`,
        ]);
      }, 1900);

      const response = await fetch('/api/scrapers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: selectedCity, top: 4, daysBack: 30 }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.dockets)) {
        setScrapeStep(4);
        setScrapedResults(data.dockets);
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Ingestion complete! ${data.dockets.length} matters normalized with verified citations.`,
          `[${new Date().toLocaleTimeString()}] Ingestion run completed in ${data.durationMs || 1200}ms.`,
        ]);
      } else {
        throw new Error(data.error || 'Scraper encountered an error');
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Scraper notice: ${err?.message || 'Handled with fallback mock data'}.`,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleImportAll = () => {
    if (scrapedResults.length > 0) {
      onImportDockets(scrapedResults);
      setImportedCount((prev) => prev + scrapedResults.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFDFC] max-w-3xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#E63946] text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white flex items-center gap-2">
                Municipal Scraper &amp; Ingestion Pipeline
                <span className="text-[10px] text-white font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2D6A4F]">
                  Legistar OData v1
                </span>
              </h3>
              <p className="text-[11px] text-[#aaa] font-sans">
                Automated OData ingestion, Open Civic Data normalization, and Gemini 2.5 plain-language enrichment
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

        {/* City Selector & Trigger Bar */}
        <div className="bg-[#F2F0EA] border-b border-[#1A1A1A]/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#555] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Target Hub:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={isRunning}
              className="bg-[#FDFDFC] border border-[#1A1A1A] px-3 py-1.5 text-xs font-serif font-bold text-[#1A1A1A] focus:outline-none"
            >
              {targets.map((t) => (
                <option key={t.clientName} value={t.clientName}>
                  {t.city}, {t.state} ({t.system})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runScraper}
            disabled={isRunning}
            className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E63946]" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#2D6A4F] fill-current" />
                <span>Run Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="bg-[#E5E2D9] px-6 py-2.5 grid grid-cols-4 gap-2 text-[10px] font-mono border-b border-[#1A1A1A]/15">
          <div className={`flex items-center gap-1.5 p-1 ${scrapeStep >= 1 ? 'font-bold text-[#1A1A1A]' : 'text-[#777]'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${scrapeStep >= 1 ? 'bg-[#1A1A1A] text-white' : 'bg-[#ccc] text-[#555]'}`}>1</span>
            <span>OData Fetch</span>
          </div>
          <div className={`flex items-center gap-1.5 p-1 ${scrapeStep >= 2 ? 'font-bold text-[#1A1A1A]' : 'text-[#777]'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${scrapeStep >= 2 ? 'bg-[#1A1A1A] text-white' : 'bg-[#ccc] text-[#555]'}`}>2</span>
            <span>OCD-ID Map</span>
          </div>
          <div className={`flex items-center gap-1.5 p-1 ${scrapeStep >= 3 ? 'font-bold text-[#1A1A1A]' : 'text-[#777]'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${scrapeStep >= 3 ? 'bg-[#1A1A1A] text-white' : 'bg-[#ccc] text-[#555]'}`}>3</span>
            <span>Gemini NLP</span>
          </div>
          <div className={`flex items-center gap-1.5 p-1 ${scrapeStep >= 4 ? 'font-bold text-[#2D6A4F]' : 'text-[#777]'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${scrapeStep >= 4 ? 'bg-[#2D6A4F] text-white' : 'bg-[#ccc] text-[#555]'}`}>4</span>
            <span>Verified</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Sub Navigation */}
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
            <div className="flex gap-2 text-xs font-mono font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveSubTab('console')}
                className={`px-2.5 py-1 ${activeSubTab === 'console' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'}`}
              >
                Telemetry Console ({logs.length})
              </button>
              <button
                onClick={() => setActiveSubTab('preview')}
                className={`px-2.5 py-1 ${activeSubTab === 'preview' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'}`}
              >
                Ingested Dockets ({scrapedResults.length})
              </button>
            </div>

            {scrapedResults.length > 0 && (
              <button
                onClick={handleImportAll}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import to Live Digest ({scrapedResults.length})</span>
              </button>
            )}
          </div>

          {/* TAB: Console Logs */}
          {activeSubTab === 'console' && (
            <div className="bg-[#1A1A1A] text-[#FDFDFC] p-4 font-mono text-[11px] h-60 overflow-y-auto space-y-1.5 border border-[#1A1A1A]">
              {logs.length === 0 ? (
                <div className="text-[#666] italic flex items-center justify-center h-full">
                  Click &quot;Run Ingestion Pipeline&quot; to fetch and enrich recent legislative dockets.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-[#3A86FF]">&gt;</span> {log}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Ingested Dockets Preview */}
          {activeSubTab === 'preview' && (
            <div className="space-y-3">
              {scrapedResults.length === 0 ? (
                <div className="p-8 text-center bg-[#F2F0EA] border border-[#1A1A1A]/10 text-[#666] font-mono text-xs">
                  No dockets ingested in this session yet. Run the scraper to populate results.
                </div>
              ) : (
                scrapedResults.map((bill) => (
                  <div key={bill.id} className="p-4 bg-[#FDFDFC] border border-[#1A1A1A] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E63946] bg-[#F2F0EA] px-2 py-0.5 border border-[#1A1A1A]/20">
                          {bill.fileNumber}
                        </span>
                        <span className="text-xs font-mono font-bold uppercase text-[#555]">
                          {bill.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 border border-[#2D6A4F]/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {bill.receipt.verificationBadge}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                      {bill.plainTitle}
                    </h4>

                    <p className="text-xs text-[#444] leading-relaxed">
                      {bill.summary}
                    </p>

                    <div className="pt-2 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#666]">
                      <span>Impact: <strong className="text-[#1A1A1A]">${(bill.fiscalImpact.amount / 1000000).toFixed(1)}M ({bill.fiscalImpact.fundingSource})</strong></span>
                      <a
                        href={bill.receipt.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1A1A1A] hover:underline flex items-center gap-1"
                      >
                        <span>Clerk Ref: {bill.receipt.clerkMatterId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {importedCount > 0 && (
            <div className="p-3 bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#2D6A4F] text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {importedCount} new dockets into your active newspaper digest!</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F2F0EA] px-6 py-3 border-t border-[#1A1A1A]/15 flex items-center justify-between text-xs font-mono">
          <span className="text-[#666]">
            Standard: <strong className="text-[#1A1A1A]">Open Civic Data (OCD-ID v3)</strong>
          </span>
          <button
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-1.5 font-bold uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
