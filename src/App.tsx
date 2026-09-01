/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Filter, 
  PlusCircle, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DocketCard } from './components/DocketCard';
import { ReceiptModal } from './components/ReceiptModal';
import { MultiPerspectiveView } from './components/MultiPerspectiveView';
import { SentimentHub } from './components/SentimentHub';
import { AccountabilityDashboard } from './components/AccountabilityDashboard';
import { MeetingsView } from './components/MeetingsView';
import { DocketScanner } from './components/DocketScanner';
import { CivicCopilotDrawer } from './components/CivicCopilotDrawer';
import { AlertsModal } from './components/AlertsModal';
import { SocialDispatchModal } from './components/SocialDispatchModal';

import { JURISDICTIONS, BILLS as INITIAL_BILLS } from './data/mockData';
import { 
  OCDJurisdiction, 
  OCDBill, 
  ActiveTab, 
  PolicyCategory, 
  ReceiptCitation 
} from './types';

export default function App() {
  const [jurisdictions] = useState<OCDJurisdiction[]>(JURISDICTIONS);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<OCDJurisdiction>(JURISDICTIONS[0]);
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('digest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  const [bills, setBills] = useState<OCDBill[]>(INITIAL_BILLS);
  const [activeReceipt, setActiveReceipt] = useState<{ receipt: ReceiptCitation; title: string } | null>(null);
  const [perspectiveBillId, setPerspectiveBillId] = useState<string>(INITIAL_BILLS[0]?.id);
  
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);
  const [socialModalBill, setSocialModalBill] = useState<OCDBill | null>(null);

  // Filter bills based on jurisdiction, ward, category, search, and status
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Jurisdiction match
      if (b.jurisdictionId && b.jurisdictionId !== selectedJurisdiction.id) {
        // if user changed jurisdiction, keep or filter appropriately
      }

      // Ward filter
      if (selectedWardId !== 'all' && b.divisionId && b.divisionId !== selectedWardId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && b.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && b.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.plainTitle.toLowerCase().includes(q) || b.title.toLowerCase().includes(q);
        const matchSummary = b.summary.toLowerCase().includes(q);
        const matchFile = b.fileNumber.toLowerCase().includes(q);
        const matchWho = b.whoItAffects.toLowerCase().includes(q);
        const matchTags = b.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchFile && !matchWho && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [bills, selectedJurisdiction, selectedWardId, selectedCategory, selectedStatus, searchQuery]);

  const categories: string[] = [
    'All',
    'Zoning & Housing',
    'Infrastructure & Public Works',
    'Environment & Parks',
    'Public Safety',
    'Budget & Finance',
  ];

  const handleOpenReceipt = (bill: OCDBill) => {
    setActiveReceipt({
      receipt: bill.receipt,
      title: `${bill.fileNumber}: ${bill.plainTitle}`,
    });
  };

  const handleOpenPerspectives = (bill: OCDBill) => {
    setPerspectiveBillId(bill.id);
    setActiveTab('perspectives');
  };

  const handleAddParsedBill = (newBill: Partial<OCDBill>) => {
    setBills((prev) => [newBill as OCDBill, ...prev]);
    setActiveTab('digest');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#1A1A1A] selection:text-[#FDFDFC]">
      
      {/* Global Editorial Navigation & Masthead */}
      <Navbar
        jurisdictions={jurisdictions}
        selectedJurisdiction={selectedJurisdiction}
        onSelectJurisdiction={setSelectedJurisdiction}
        selectedWardId={selectedWardId}
        onSelectWardId={setSelectedWardId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        isCopilotOpen={isCopilotOpen}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSocialDispatch={() => {
          setSocialModalBill(bills[0] || null);
          setIsSocialModalOpen(true);
        }}
      />

      {/* Main Newspaper / Editorial Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Civic Digest Tab */}
        {activeTab === 'digest' && (
          <div className="space-y-6">
            
            {/* Editorial Front-Page Feature Banner */}
            <section className="border-b-2 border-[#1A1A1A] pb-6">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                
                {/* Left: Lead Headline & Context */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#E63946] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest font-mono">
                      Lead Dispatch
                    </span>
                    <span className="text-xs font-mono text-[#777]">
                      {selectedJurisdiction.name} Bureau • Vol. IX
                    </span>
                    {selectedWardId !== 'all' && (
                      <span className="text-[11px] font-mono font-medium bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5">
                        Ward Focus: {selectedJurisdiction.divisions.find((d) => d.id === selectedWardId)?.name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif leading-[1.08] font-light text-[#1A1A1A]">
                    Municipal Dockets, Council Roll Calls &amp; <span className="italic font-serif">Community Policy Record.</span>
                  </h2>

                  <p className="text-sm sm:text-base text-[#444] leading-relaxed max-w-3xl font-sans">
                    Translating dense municipal legalese into verifiable plain-language summaries with primary source receipt checks, council audit trails, and multi-angle news analysis.
                  </p>
                </div>

                {/* Right: Quick Ingestion / Scanner Callout */}
                <div className="lg:w-72 w-full bg-[#F2F0EA] border border-[#1A1A1A]/15 p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#1A1A1A]/20 pb-1.5 mb-2">
                      Docket Intake Desk
                    </h3>
                    <p className="text-xs text-[#555] leading-relaxed">
                      Have a raw council ordinance or zoning notice? Run our instant AI intake parser to extract plain-language impact notes.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="w-full bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] text-xs font-bold uppercase tracking-wider py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
                    <span>Scan Raw Docket</span>
                  </button>
                </div>

              </div>
            </section>

            {/* Editorial Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[#1A1A1A]/15">
              
              {/* Category Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#777] mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Section:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 transition-colors border ${
                      selectedCategory === cat
                        ? 'bg-[#1A1A1A] text-[#FDFDFC] border-[#1A1A1A]'
                        : 'bg-[#FDFDFC] text-[#555] border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#555] shrink-0">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-[#F2F0EA] border border-[#1A1A1A]/30 text-xs text-[#1A1A1A] font-bold py-1 px-2.5 focus:outline-none focus:border-[#1A1A1A] cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Passed">Passed / Enacted</option>
                  <option value="In Committee">In Committee / Hearing</option>
                  <option value="Introduced">Recently Introduced</option>
                </select>
              </div>

            </div>

            {/* Editorial Bills Grid */}
            {filteredBills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {filteredBills.map((bill) => (
                  <DocketCard
                    key={bill.id}
                    bill={bill}
                    onViewReceipt={handleOpenReceipt}
                    onViewPerspectives={handleOpenPerspectives}
                    onShareBill={(b) => {
                      setSocialModalBill(b);
                      setIsSocialModalOpen(true);
                    }}
                    onSelectTag={(tag) => setSearchQuery(tag)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#F2F0EA] border border-[#1A1A1A]/15 p-12 text-center space-y-3">
                <FileText className="w-8 h-8 mx-auto text-[#777] stroke-1" />
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">No legislative dockets match your search</h3>
                <p className="text-xs text-[#555] max-w-sm mx-auto">
                  Try clearing the search filters, switching categories, or using the AI Docket Scanner to ingest a new municipal bill.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedStatus('All');
                    setSelectedWardId('all');
                  }}
                  className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#1A1A1A] bg-[#FDFDFC] border border-[#1A1A1A] px-3.5 py-2 hover:bg-[#1A1A1A] hover:text-[#FDFDFC] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}

          </div>
        )}

        {/* Meeting Summaries & Agendas Tab */}
        {activeTab === 'meetings' && (
          <MeetingsView
            onSelectBill={(billId) => {
              setPerspectiveBillId(billId);
              setActiveTab('perspectives');
            }}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {/* Ground-Style Multi-Perspective Engine Tab */}
        {activeTab === 'perspectives' && (
          <MultiPerspectiveView
            bills={bills}
            selectedBillId={perspectiveBillId}
            onSelectBill={(id) => setPerspectiveBillId(id)}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {/* Privacy-Preserving Sentiment Hub Tab */}
        {activeTab === 'sentiment' && (
          <SentimentHub
            selectedWardId={selectedWardId}
            onSelectWardId={setSelectedWardId}
          />
        )}

        {/* Accountability & Outcome Dashboard Tab */}
        {activeTab === 'accountability' && (
          <AccountabilityDashboard
            selectedWardId={selectedWardId}
          />
        )}

        {/* AI Docket Scanner Tab */}
        {activeTab === 'scanner' && (
          <DocketScanner
            onAddParsedBill={handleAddParsedBill}
          />
        )}

      </main>

      {/* Primary Source Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt.receipt}
          billTitle={activeReceipt.title}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Proximity & Policy Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

      {/* Civic Co-Pilot Interactive Drawer */}
      <CivicCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedJurisdiction={selectedJurisdiction}
        selectedWardId={selectedWardId}
        bills={bills}
      />

      {/* Multi-Channel Social Dispatch Modal */}
      <SocialDispatchModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        bill={socialModalBill}
        allBills={bills}
      />

      {/* Editorial Footer */}
      <footer className="border-t-2 border-[#1A1A1A] bg-[#FDFDFC] text-[#1A1A1A] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-sm uppercase italic">Civic Digest</span>
            <span className="text-[#777]">•</span>
            <span className="text-xs uppercase font-bold tracking-widest text-[#555]">
              Open Civic Data (OCD-ID) Standard
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-[#777]">
            <span>Mathematical Differential Privacy (ε-DP)</span>
            <span>•</span>
            <span>Granicus Legistar OData Feeds</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
