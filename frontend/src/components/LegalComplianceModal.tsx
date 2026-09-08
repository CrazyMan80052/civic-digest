/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Eye, 
  Lock, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Trash2,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { useModalKeyboard } from '../lib/useModalKeyboard';

export type ComplianceTab = 'accessibility' | 'disclaimer' | 'ai_disclosure' | 'privacy' | 'terms';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ComplianceTab;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'accessibility',
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>(initialTab);
  const [clearedDataSuccess, setClearedDataSuccess] = useState<boolean>(false);

  // Accessible Escape key listener and focus restore
  useModalKeyboard(isOpen, onClose);

  // Sync tab if initialTab changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setClearedDataSuccess(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handlePurgeLocalData = () => {
    try {
      localStorage.removeItem('civicdigest_user_profile');
      localStorage.removeItem('civicdigest_cached_dockets');
      setClearedDataSuccess(true);
      setTimeout(() => {
        setClearedDataSuccess(false);
      }, 3000);
    } catch (e) {
      console.warn('Unable to clear localStorage:', e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-modal-title"
        className="bg-[#FDFDFC] max-w-3xl w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="compliance-modal-title" className="font-serif font-bold text-lg text-white">
                Compliance, Accessibility &amp; Legal Center
              </h2>
              <p className="text-xs text-[#D1D5DB] font-sans">
                ADA Title III / WCAG 2.1 AA • Official Records Disclaimer • AI &amp; Privacy Disclosures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal and accessibility center dialog"
            className="text-[#D1D5DB] hover:text-white p-1 hover:bg-[#333] transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <nav 
          role="tablist" 
          aria-label="Compliance Topics"
          className="bg-[#F2F0EA] border-b border-[#1A1A1A]/20 px-6 pt-3 flex gap-1 sm:gap-2 text-xs font-bold uppercase tracking-wider font-mono overflow-x-auto scrollbar-none"
        >
          <button
            type="button"
            role="tab"
            id="tab-accessibility"
            aria-selected={activeTab === 'accessibility'}
            aria-controls="panel-accessibility"
            onClick={() => setActiveTab('accessibility')}
            className={`px-3 py-2 border-t border-x border-[#1A1A1A] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'accessibility' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
            <span>Accessibility (ADA)</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-disclaimer"
            aria-selected={activeTab === 'disclaimer'}
            aria-controls="panel-disclaimer"
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 py-2 border-t border-x border-[#1A1A1A] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'disclaimer' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
            <span>Public Records Disclaimer</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-ai-disclosure"
            aria-selected={activeTab === 'ai_disclosure'}
            aria-controls="panel-ai-disclosure"
            onClick={() => setActiveTab('ai_disclosure')}
            className={`px-3 py-2 border-t border-x border-[#1A1A1A] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ai_disclosure' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
            <span>AI Transparency</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-privacy"
            aria-selected={activeTab === 'privacy'}
            aria-controls="panel-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 border-t border-x border-[#1A1A1A] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#2B4162]" aria-hidden="true" />
            <span>Privacy &amp; ε-DP</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-terms"
            aria-selected={activeTab === 'terms'}
            aria-controls="panel-terms"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 border-t border-x border-[#1A1A1A] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'terms' ? 'bg-[#FDFDFC] text-[#1A1A1A]' : 'bg-[#E5E2D9] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#525252]" aria-hidden="true" />
            <span>Terms of Use</span>
          </button>
        </nav>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#1A1A1A] leading-relaxed text-sm">
          
          {/* TAB 1: Accessibility Statement (ADA Title III & WCAG 2.1 AA) */}
          {activeTab === 'accessibility' && (
            <div id="panel-accessibility" role="tabpanel" aria-labelledby="tab-accessibility" className="space-y-4">
              <div className="border-l-4 border-[#2D6A4F] pl-4 py-1 bg-[#2D6A4F]/5">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Accessibility Statement &amp; WCAG 2.1 AA Commitment
                </h3>
                <p className="text-xs text-[#525252]">
                  Conforms to Americans with Disabilities Act (ADA) Title III, Section 508, and W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <p>
                  <strong>Civic Digest</strong> is dedicated to ensuring digital accessibility for people of all abilities. We believe municipal legislation and public records must be accessible to every resident, including individuals using screen readers, keyboard-only navigation, speech recognition software, or screen magnification.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A] pt-2">
                  Conformance Measures Implemented:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#333]">
                  <li><strong>Keyboard Navigation &amp; Bypass Blocks:</strong> An immediate &quot;Skip to Main Content&quot; bypass link allows keyboard users to bypass header elements directly to the core dockets. All modal dialogs support the standard <code>Escape</code> key for dismissal.</li>
                  <li><strong>Semantic ARIA Landmarks:</strong> Full programmatic structure utilizing <code>header</code> (banner), <code>nav</code> (main navigation), <code>main</code>, and <code>footer</code> (contentinfo) roles.</li>
                  <li><strong>Accessible Form Controls &amp; Name/Role/Value:</strong> Every search box, filter dropdown, and slider contains descriptive labels and ARIA value indicators.</li>
                  <li><strong>Color Contrast &amp; Typography:</strong> Text meets or exceeds the WCAG 2.1 Level AA requirement of at least 4.5:1 contrast ratio against light and dark surfaces.</li>
                  <li><strong>Reduced Motion:</strong> Full support for the <code>prefers-reduced-motion</code> media query to protect users with vestibular conditions.</li>
                  <li><strong>Receipt Verification Accessibility:</strong> Primary source citations and PDF clerk matter references provide direct textual descriptions.</li>
                </ul>

                <div className="bg-[#F2F0EA] border border-[#1A1A1A]/20 p-4 space-y-2 mt-4">
                  <h4 className="font-bold font-serif text-sm text-[#1A1A1A] flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                    Accessibility Feedback &amp; Accommodations Coordinator
                  </h4>
                  <p className="text-xs text-[#525252]">
                    If you encounter an accessibility barrier or need an alternative format (large print, plain text, or audio transcript) for any municipal docket, please contact our accessibility team directly:
                  </p>
                  <div className="text-xs font-mono font-bold text-[#1A1A1A] space-y-1">
                    <p>Email: <a href="mailto:accessibility@civicdigest.org" className="underline hover:text-[#2D6A4F]">accessibility@civicdigest.org</a></p>
                    <p>Response Time: Within 48 business hours with dedicated remediation.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Municipal Records & Non-Affiliation Disclaimer */}
          {activeTab === 'disclaimer' && (
            <div id="panel-disclaimer" role="tabpanel" aria-labelledby="tab-disclaimer" className="space-y-4">
              <div className="border-l-4 border-[#E63946] pl-4 py-1 bg-[#E63946]/5">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Official Records &amp; Non-Affiliation Statutory Disclaimer
                </h3>
                <p className="text-xs text-[#525252]">
                  Independent non-partisan civic transparency platform. Not an official municipal agency.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-[#FFF5F5] border border-[#E63946]/30 p-4 text-xs text-[#900] space-y-2">
                  <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#E63946]" aria-hidden="true" />
                    Important Notice Concerning Official Municipal Actions
                  </p>
                  <p>
                    <strong>Civic Digest is an independent non-profit civic technology initiative and is NOT an official agency, department, clerk&apos;s office, or legal representative of any municipal corporation, city council, or county government.</strong>
                  </p>
                </div>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A] pt-1">
                  1. Official Public Record Repository
                </h4>
                <p className="text-xs text-[#444]">
                  Official ordinances, resolutions, legally binding roll-call voting journals, public hearing notices, and certified municipal minutes reside exclusively with the respective <strong>City Clerk</strong> and official government portals (such as Granicus Legistar, PrimeGov, or municipal archives).
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A] pt-1">
                  2. Primary Source Receipt Verification Protocol
                </h4>
                <p className="text-xs text-[#444]">
                  To eliminate risk of confusion or error, every ordinance summarized on Civic Digest is anchored to a <strong>Primary Source Receipt Citation</strong> containing the clerk matter ID, official document title, and direct link to the municipal portal. Users must consult the primary source documents before taking any legal, financial, or zoning action.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A] pt-1">
                  3. No Legal or Professional Advice
                </h4>
                <p className="text-xs text-[#444]">
                  The information provided on this website is for general educational, civic engagement, and transparency purposes only. Nothing on Civic Digest constitutes legal advice, statutory interpretation, zoning certification, or professional consultation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: AI & Algorithmic Transparency Disclosure */}
          {activeTab === 'ai_disclosure' && (
            <div id="panel-ai-disclosure" role="tabpanel" aria-labelledby="tab-ai-disclosure" className="space-y-4">
              <div className="border-l-4 border-[#1A1A1A] pl-4 py-1 bg-[#F2F0EA]">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  AI &amp; Algorithmic Transparency Disclosure
                </h3>
                <p className="text-xs text-[#525252]">
                  Compliance with Federal Trade Commission (FTC) AI transparency guidelines and state artificial intelligence disclosure statutes.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <p>
                  In accordance with emerging transparency regulations, users are notified that <strong>Civic Digest utilizes generative artificial intelligence and natural language processing models (including Google Gemini models)</strong> to translate complex legislative legalese into accessible plain-language civic digests.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/15 space-y-1">
                    <span className="font-mono font-bold uppercase text-[10px] text-[#2D6A4F] block">Grounded Summaries</span>
                    <p className="text-[#333]">
                      Summaries are strictly prompted to quote verbatim text from official clerk dockets. Hallucinated facts or unsourced claims are prohibited by our ingestion pipeline.
                    </p>
                  </div>
                  <div className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/15 space-y-1">
                    <span className="font-mono font-bold uppercase text-[10px] text-[#2B4162] block">Multi-Perspective Stances</span>
                    <p className="text-[#333]">
                      Perspectives reflect public testimonies, local media reporting, and sponsor statements. They do not represent an endorsement by Civic Digest.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FFFBEB] border border-[#D97706]/30 p-4 text-xs text-[#92400E] space-y-1 mt-2">
                  <p className="font-bold">Algorithmic Limitation &amp; User Verification Duty</p>
                  <p>
                    Natural language processing systems may occasionally misinterpret nuance, fiscal notes, or statutory cross-references. Always click <strong>&quot;Receipt Check&quot;</strong> on any docket to inspect the underlying clerk text before citing or relying on a summary.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy Policy & Zero-Party Data Protection (CCPA/CPRA) */}
          {activeTab === 'privacy' && (
            <div id="panel-privacy" role="tabpanel" aria-labelledby="tab-privacy" className="space-y-4">
              <div className="border-l-4 border-[#2B4162] pl-4 py-1 bg-[#2B4162]/5">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Zero-Party Privacy Policy &amp; Differential Privacy (ε-DP)
                </h3>
                <p className="text-xs text-[#525252]">
                  Compliant with CCPA, CPRA, CalOPPA, and European GDPR privacy principles.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  1. Zero-Party Local Storage Architecture
                </h4>
                <p className="text-xs text-[#444]">
                  Your residential street address, ward location, and policy preference topics are stored <strong>strictly on your device&apos;s local browser storage (<code>localStorage</code>)</strong>. Civic Digest does not maintain a centralized surveillance database of resident addresses.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  2. Mathematical Differential Privacy (Laplace Mechanism)
                </h4>
                <p className="text-xs text-[#444]">
                  When you submit a constituent pulse score or economic micro-survey, your response is protected using <strong>formal Differential Privacy (ε-DP)</strong>. Mathematical Laplace noise is injected into aggregated ward metrics, guaranteeing that no individual citizen&apos;s response can ever be reverse-engineered, deanonymized, or subpoenaed.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  3. Non-Commercial &amp; No Sale of Data
                </h4>
                <p className="text-xs text-[#444]">
                  Civic Digest <strong>NEVER</strong> sells, trades, rents, or commercializes resident data or location information to data brokers, political campaigns, or commercial advertisers.
                </p>

                {/* Local Data Clear Action */}
                <div className="bg-[#F2F0EA] border border-[#1A1A1A]/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <div>
                    <span className="font-bold text-xs text-[#1A1A1A] block">Purge Resident Data From Browser</span>
                    <span className="text-[11px] text-[#525252]">Instantly wipe your saved address, ward setting, and preference cookies.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePurgeLocalData}
                    className="px-3 py-2 bg-[#E63946] hover:bg-[#c52834] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear Stored Data</span>
                  </button>
                </div>
                {clearedDataSuccess && (
                  <p className="text-xs text-[#2D6A4F] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Local address and preference data successfully cleared.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Terms of Use & Fair Use License */}
          {activeTab === 'terms' && (
            <div id="panel-terms" role="tabpanel" aria-labelledby="tab-terms" className="space-y-4">
              <div className="border-l-4 border-[#1A1A1A] pl-4 py-1 bg-[#F2F0EA]">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Terms of Service &amp; Open Civic Data Licensing
                </h3>
                <p className="text-xs text-[#525252]">
                  Public records fair use, Open Civic Data (OCD-ID v3) schema standards, and terms of service.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <p>
                  By accessing Civic Digest, you agree to these Terms of Service. Municipal legislative records, meeting agendas, and roll-call votes ingested from public portals are public domain records under federal and state sunshine laws.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  1. Permitted Use &amp; Scraping Rate Limits
                </h4>
                <p className="text-xs text-[#444]">
                  You may use the Civic Digest platform and APIs for non-commercial research, journalism, community organizing, and civic education. Automated ingestion from Civic Digest endpoints must respect standard rate limits (maximum 60 requests per minute) and identify via a descriptive User-Agent header.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  2. Third-Party Links &amp; Attachments
                </h4>
                <p className="text-xs text-[#444]">
                  Civic Digest provides outbound links to external municipal portals, Legistar attachments, and committee audio/video feeds. Civic Digest exercises no editorial control over external government servers and assumes no responsibility for third-party server downtime or document accuracy.
                </p>

                <h4 className="font-bold font-serif text-sm text-[#1A1A1A]">
                  3. Limitation of Liability
                </h4>
                <p className="text-xs text-[#444]">
                  To the maximum extent permitted by applicable law, Civic Digest and its contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this platform, including any reliance upon AI summaries, receipt citations, or meeting calendar notifications.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F2F0EA] px-6 py-3 border-t border-[#1A1A1A]/20 flex items-center justify-between text-xs font-mono">
          <span className="text-[#525252] text-[11px]">
            Civic Digest Governance v3.2 • Conformance: WCAG 2.1 Level AA
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-bold uppercase tracking-wider text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
