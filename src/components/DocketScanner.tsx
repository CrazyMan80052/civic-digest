/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  FileCode2, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { OCDBill } from '../types';

interface DocketScannerProps {
  onAddParsedBill?: (newBill: Partial<OCDBill>) => void;
}

const SAMPLE_LEGALESE = {
  sacramentoZoning: `AN ORDINANCE AMENDING TITLE 17 (ZONING CODE) OF THE SACRAMENTO CITY CODE RELATING TO ACCESSORY DWELLING UNITS (ADUs) AND INFILL MULTI-FAMILY PARCEL CONVERSIONS.
WHEREAS, the City Council finds that escalating median housing costs and persistent structural supply deficits disproportionately burden workforce households in Council Districts 4 and 6; and
WHEREAS, Section 65852.2 of the California Government Code authorizes local municipalities to enact streamlined ministerial permitting standards for transit-proximate residential parcels;
NOW, THEREFORE, BE IT ORDAINED BY THE COUNCIL OF THE CITY OF SACRAMENTO:
Section 1. Section 17.228.105 is hereby amended to eliminate discretionary design review hearings for detached accessory dwelling units conforming to maximum building envelope height of 24 feet within 800 meters of light rail transit stations.
Section 2. Fiscal Impact: Establishes a zero-dollar General Fund impact; offsets administrative review expenditures through standardized $420 ministerial plan-check permit fees.`,
  
  clevelandGreenway: `ORDINANCE NO. 1042-2026. AUTHORIZING THE DIRECTOR OF CAPITAL PROJECTS TO ENTER INTO A PUBLIC-PRIVATE PARTNERSHIP AND FINANCING AGREEMENT WITH CUYAHOGA COUNTY AND TRUST FOR PUBLIC LAND FOR THE DESIGN AND ACQUISITION OF RIGHT-OF-WAY FOR THE CUYAHOGA RIVER HEALTH CORRIDOR EXTENSION, IN AN AMOUNT NOT TO EXCEED $3,750,000.00.
BE IT ORDAINED BY THE COUNCIL OF THE CITY OF CLEVELAND:
Section 1. That the Director of Capital Projects is authorized to execute agreements and disburse up to $3,750,000.00 from the Clean Ohio Trails Fund (Fund 22A) and ARPA Neighborhood Revitalization Sub-account for 2.4 miles of separated pedestrian and cycle tracks connecting Slavic Village to the Cleveland Lakefront.
Section 2. Environmental Assessment: Mandates Phase II environmental site assessment and permeable pavement installation to mitigate stormwater runoff into the Cuyahoga River basin.`,

  taxAbatement: `RESOLUTION NO. 2026-058. APPROVING A 15-YEAR 75% REAL PROPERTY TAX ABATEMENT PURSUANT TO OHIO REVISED CODE CHAPTER 5709 FOR THE REDEVELOPMENT OF THE HISTORIC WARNER & SWASEY COMPLEX INTO 112 UNITS OF MIXED-INCOME AFFORDABLE HOUSING AND COMMERCIAL MAKER SPACE IN WARD 7.
BE IT RESOLVED BY THE COUNCIL OF THE CITY OF CLEVELAND:
Section 1. That the proposed Community Reinvestment Area (CRA) agreement guarantees a minimum 25% of residential units shall be deed-restricted for households earning at or below 60% of Area Median Income (AMI) for a duration not less than 30 years.
Section 2. Cleveland Municipal School District (CMSD) Hold-Harmless: Developer shall make annual direct pilot payments of $65,000.00 to the Board of Education to fully neutralize local educational levy revenue impacts.`,
};

export const DocketScanner: React.FC<DocketScannerProps> = ({ onAddParsedBill }) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_LEGALESE.sacramentoZoning);
  const [fileNumber, setFileNumber] = useState<string>('Ord. 2026-0891');
  const [jurisdiction, setJurisdiction] = useState<string>('City Council');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleScan = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/gemini/summarize-docket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputText,
          fileNumber,
          jurisdiction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setParsedResult(data);
      } else {
        throw new Error('Failed to parse docket');
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToDigest = () => {
    if (!parsedResult) return;
    const newBill: Partial<OCDBill> = {
      id: `ocd-bill/custom-${Date.now()}`,
      fileNumber: fileNumber || 'Ord. Custom',
      title: inputText.slice(0, 120),
      plainTitle: parsedResult.plainTitle,
      summary: parsedResult.summary,
      whoItAffects: parsedResult.whoItAffects,
      category: parsedResult.category || 'Zoning & Housing',
      status: 'Introduced',
      isConsentCalendar: false,
      introducedDate: new Date().toISOString().split('T')[0],
      lastActionDate: new Date().toISOString().split('T')[0],
      fiscalImpact: parsedResult.fiscalImpact || {
        amount: 0,
        fundingSource: 'General Fund',
        isTaxpayerDirect: false,
        description: 'Parsed via scanner',
      },
      sponsors: ['Council Legislative Committee'],
      receipt: {
        documentTitle: `Scanned Municipal Docket - ${fileNumber}`,
        officialUrl: '#',
        paragraphSnippet: parsedResult.receiptSnippet,
        clerkMatterId: `SCAN-${Date.now().toString().slice(-4)}`,
        fileNumber: fileNumber || 'Custom',
        verificationBadge: 'Community Verified',
        verifiedAt: new Date().toISOString(),
      },
      perspectives: {
        officialDocketStance: {
          sponsorIntent: parsedResult.summary,
          legalDepartmentNote: 'Scanned legal text parsed via Gemini Legislative AI engine.',
          fiscalReviewNote: parsedResult.fiscalImpact?.description || 'N/A',
        },
        mediaPerspectives: [
          {
            sourceName: 'CivicDigest Ingestion Engine',
            sourceType: 'Local Digital Journal',
            biasRating: 'Local Nonpartisan',
            headline: parsedResult.plainTitle,
            articleUrl: '#',
            summary: parsedResult.summary,
            keyStance: 'Automated synthesis of submitted docket text.',
            publishedDate: new Date().toISOString().split('T')[0],
          },
        ],
        publicCommentBreakdown: {
          totalComments: 12,
          supportPercentage: 70,
          opposePercentage: 20,
          neutralPercentage: 10,
          topResidentThemes: [
            { theme: 'Neighborhood Impact', sentiment: 'pro', quoteSample: '"Directly responds to local zoning and infrastructure priorities."' },
          ],
        },
      },
      tags: ['Scanned', 'AI-Extracted', 'Custom'],
    };

    onAddParsedBill?.(newBill);
    setSavedSuccess(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Masthead */}
      <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 bg-[#1A1A1A] text-[#FDFDFC]">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">
                Legislative Docket Ingestion Scanner
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#555] max-w-3xl font-sans leading-relaxed">
              Paste dense municipal ordinances, zoning drafts, or Legistar docket text. The Gemini API extracts verified plain-language summaries, fiscal impact notes, affected demographics, and primary source receipt citations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30 px-3 py-1.5 font-mono font-bold uppercase tracking-wider">
              Engine: gemini-3.7-flash
            </span>
          </div>
        </div>
      </div>

      {/* Main Scanner Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Pane */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1A1A1A]/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5 font-mono">
                <FileCode2 className="w-4 h-4 text-[#1A1A1A]" />
                Raw Municipal Docket Text
              </h3>
              
              {/* Quick Sample Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#777] font-mono">Presets:</span>
                <button
                  onClick={() => {
                    setInputText(SAMPLE_LEGALESE.sacramentoZoning);
                    setFileNumber('Ord. 2026-0891');
                    setJurisdiction('City of Sacramento');
                  }}
                  className="text-[10px] bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5 font-mono transition-colors"
                >
                  ADU Zoning
                </button>
                <button
                  onClick={() => {
                    setInputText(SAMPLE_LEGALESE.clevelandGreenway);
                    setFileNumber('Ord. 1042-2026');
                    setJurisdiction('City of Cleveland');
                  }}
                  className="text-[10px] bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5 font-mono transition-colors"
                >
                  Trail Bond
                </button>
                <button
                  onClick={() => {
                    setInputText(SAMPLE_LEGALESE.taxAbatement);
                    setFileNumber('Res. 2026-058');
                    setJurisdiction('City of Cleveland');
                  }}
                  className="text-[10px] bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5 font-mono transition-colors"
                >
                  Abatement
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1 font-mono">
                  File / Ordinance Number
                </label>
                <input
                  type="text"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  placeholder="e.g. Ord. 882-2026"
                  className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1 font-mono">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. City of Cleveland"
                  className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] text-xs font-sans"
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1 font-mono">
                Legalese &amp; Attachment Body
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={11}
                placeholder="Paste municipal docket text, committee resolutions, or council agenda notes here..."
                className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-3 text-xs font-mono text-[#1A1A1A] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning || !inputText.trim()}
            className="w-full bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] font-bold uppercase tracking-wider py-3 px-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#E63946]" />
                <span>Parsing Docket with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E63946]" />
                <span>Extract Plain-Language Civic Summary</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Output & Receipt Extraction Pane */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/20 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
                Structured Civic Extraction &amp; Receipt
              </h3>
              {parsedResult && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1A1A1A] text-white px-2 py-0.5">
                  {parsedResult.category}
                </span>
              )}
            </div>

            {parsedResult ? (
              <div className="space-y-4 animate-in fade-in duration-300 text-xs">
                
                {/* Headline */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#777] tracking-widest block font-mono">
                    Plain Title
                  </span>
                  <h4 className="text-xl font-serif font-bold text-[#1A1A1A] mt-0.5">
                    {parsedResult.plainTitle}
                  </h4>
                </div>

                {/* Summary */}
                <div className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/10">
                  <span className="text-[10px] uppercase font-bold text-[#777] tracking-widest block mb-1 font-mono">
                    Plain-Language Summary
                  </span>
                  <p className="text-xs text-[#333] leading-relaxed font-sans">
                    {parsedResult.summary}
                  </p>
                </div>

                {/* Demographic & Fiscal Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#777] tracking-wider flex items-center gap-1 font-mono">
                      <Users className="w-3.5 h-3.5 text-[#1A1A1A]" />
                      Who It Affects
                    </span>
                    <p className="text-[#1A1A1A] font-medium font-sans">
                      {parsedResult.whoItAffects}
                    </p>
                  </div>

                  <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#777] tracking-wider flex items-center gap-1 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]" />
                      Fiscal Impact
                    </span>
                    <p className="text-[#1A1A1A] font-bold font-mono">
                      {parsedResult.fiscalImpact?.amount > 0 ? (
                        <span className="text-[#2D6A4F]">
                          {formatCurrency(parsedResult.fiscalImpact.amount)}
                        </span>
                      ) : (
                        'No direct general fund impact'
                      )}
                    </p>
                    <p className="text-[10px] text-[#555] font-sans">
                      {parsedResult.fiscalImpact?.description}
                    </p>
                  </div>
                </div>

                {/* Key Arguments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#FDFDFC] p-3 border-l-4 border-[#2D6A4F] border-t border-r border-b border-[#1A1A1A]/15 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#2D6A4F] tracking-wider font-mono block">
                      Arguments in Favor
                    </span>
                    <ul className="list-disc list-inside text-[#333] space-y-1 font-sans">
                      {parsedResult.keyArgumentsPro?.map((pro: string, i: number) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#FDFDFC] p-3 border-l-4 border-[#E63946] border-t border-r border-b border-[#1A1A1A]/15 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#E63946] tracking-wider font-mono block">
                      Counterarguments / Concerns
                    </span>
                    <ul className="list-disc list-inside text-[#333] space-y-1 font-sans">
                      {parsedResult.keyArgumentsCon?.map((con: string, i: number) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Verifiable Receipt Excerpt */}
                <div className="bg-[#F2F0EA] border-l-4 border-[#1A1A1A] p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#777] tracking-widest flex items-center gap-1 font-mono">
                    <FileText className="w-3 h-3 text-[#1A1A1A]" />
                    Verified Primary Source Receipt Snippet
                  </span>
                  <p className="text-xs font-serif italic text-[#1A1A1A] leading-relaxed">
                    "{parsedResult.receiptSnippet}"
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-[#888] space-y-3">
                <FileCode2 className="w-10 h-10 mx-auto text-[#bbb] stroke-1" />
                <p className="text-xs max-w-xs mx-auto font-sans">
                  Click "Extract Plain-Language Civic Summary" to run real-time NLP analysis on the docket text.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {parsedResult && (
            <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-3">
              <span className="text-xs text-[#777] font-mono">
                OCD-ID Compliant Schema
              </span>
              <button
                onClick={handleSaveToDigest}
                disabled={savedSuccess}
                className="bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-1.5 transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Added to Live Feed!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#E63946]" />
                    <span>Pin to Civic Digest Feed</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

