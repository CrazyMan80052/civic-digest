/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Newspaper, 
  CalendarDays, 
  Scale, 
  ShieldCheck, 
  BarChart3, 
  Sparkles, 
  Search,
  ChevronDown,
  Bell,
  Bot,
  Share2,
  Database,
  Radio,
  Vote,
  FileText,
  User,
  MapPin
} from 'lucide-react';
import { OCDJurisdiction, ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  jurisdictions: OCDJurisdiction[];
  selectedJurisdiction: OCDJurisdiction;
  onSelectJurisdiction: (j: OCDJurisdiction) => void;
  selectedWardId: string;
  onSelectWardId: (wardId: string) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onOpenAlerts: () => void;
  onOpenSocialDispatch?: () => void;
  onOpenDbModal?: () => void;
  onOpenScraper?: () => void;
  onOpenMicroSurvey?: () => void;
  userProfile?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenBotStudio?: () => void;
  onOpenCompliance?: (tab?: 'accessibility' | 'disclaimer' | 'ai_disclosure' | 'privacy' | 'terms') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  jurisdictions,
  selectedJurisdiction,
  onSelectJurisdiction,
  selectedWardId,
  onSelectWardId,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onToggleCopilot,
  isCopilotOpen,
  onOpenAlerts,
  onOpenSocialDispatch,
  onOpenDbModal,
  onOpenScraper,
  onOpenMicroSurvey,
  userProfile,
  onOpenProfile,
  onOpenBotStudio,
  onOpenCompliance,
}) => {

  return (
    <header role="banner" className="bg-[#FDFDFC] text-[#1A1A1A] border-b-2 border-[#1A1A1A] sticky top-0 z-40 transition-colors">
      {/* Top Utility & Masthead Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        
        {/* Masthead Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#1A1A1A]/15">
          
          {/* Main Masthead Logo / Title */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#E63946] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest font-mono">
                OCD-ID v3
              </span>
              <button
                type="button"
                onClick={() => onOpenCompliance?.('accessibility')}
                title="ADA Title III & WCAG 2.1 Level AA Accessibility Statement"
                aria-label="View ADA Accessibility Statement & Compliance Information"
                className="bg-[#2D6A4F]/10 hover:bg-[#2D6A4F] text-[#2D6A4F] hover:text-white border border-[#2D6A4F]/30 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono transition-colors focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              >
                ADA / WCAG 2.1 AA
              </button>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#525252]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tighter uppercase italic text-[#1A1A1A] select-none mt-1">
              <button 
                type="button"
                onClick={() => onSelectTab('digest')}
                aria-label="Civic Digest Homepage - News and Feed"
                className="hover:opacity-90 transition-opacity text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                Civic Digest
              </button>
            </h1>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#555] mt-0.5">
              Local Governance &amp; Policy Journal • {selectedJurisdiction.name} Bureau
            </p>
          </div>

          {/* Controls Bar: Search, Jurisdiction, Ward, Alerts, Co-Pilot */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative w-44 sm:w-60">
              <label htmlFor="docket-search-input" className="sr-only">
                Search municipal dockets, ordinances, and votes
              </label>
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#525252]" aria-hidden="true" />
              <input
                id="docket-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dockets, votes..."
                aria-label="Search municipal dockets, ordinances, and votes"
                className="w-full bg-[#F2F0EA] text-xs text-[#1A1A1A] pl-8 pr-6 py-1.5 border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] focus-visible:ring-2 focus-visible:ring-[#1A1A1A] placeholder-[#525252] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search input"
                  className="absolute right-2 top-2 text-[10px] text-[#525252] hover:text-[#1A1A1A] font-bold p-0.5 focus-visible:ring-1 focus-visible:ring-[#1A1A1A]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Jurisdiction Dropdown */}
            <div className="relative">
              <label htmlFor="jurisdiction-select" className="sr-only">
                Select Municipal Jurisdiction
              </label>
              <select
                id="jurisdiction-select"
                aria-label="Select Municipal Jurisdiction"
                value={selectedJurisdiction.id}
                onChange={(e) => {
                  const found = jurisdictions.find((j) => j.id === e.target.value);
                  if (found) {
                    onSelectJurisdiction(found);
                    onSelectWardId('all');
                  }
                }}
                className="appearance-none bg-[#FDFDFC] border border-[#1A1A1A] text-xs text-[#1A1A1A] font-bold py-1.5 pl-2.5 pr-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] cursor-pointer tracking-tight"
              >
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#1A1A1A] absolute right-2 top-2.5 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Ward/District Dropdown */}
            <div className="relative hidden sm:block">
              <label htmlFor="ward-select" className="sr-only">
                Select City Ward or District
              </label>
              <select
                id="ward-select"
                aria-label="Select City Ward or District"
                value={selectedWardId}
                onChange={(e) => onSelectWardId(e.target.value)}
                className="appearance-none bg-[#F2F0EA] border border-[#1A1A1A]/30 text-xs text-[#1A1A1A] font-medium py-1.5 pl-2.5 pr-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] cursor-pointer"
              >
                <option value="all">Citywide / All Wards</option>
                {selectedJurisdiction.divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#525252] absolute right-2 top-2.5 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Database & Architecture Button */}
            {onOpenDbModal && (
              <button
                type="button"
                onClick={onOpenDbModal}
                title="PostgreSQL Database Architecture & Connection Status"
                aria-label="View PostgreSQL Database Architecture and Status"
                className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                <Database className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
                <span className="hidden lg:inline text-[10px] font-mono">DB</span>
              </button>
            )}

            {/* Scraper Pipeline Button */}
            {onOpenScraper && (
              <button
                type="button"
                onClick={onOpenScraper}
                title="Municipal Scraper & Ingestion Pipeline"
                aria-label="View Municipal Scraper and Ingestion Pipeline Control"
                className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                <Radio className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
                <span className="hidden lg:inline text-[10px] font-mono">Scraper</span>
              </button>
            )}

            {/* Proximity Alerts Button */}
            <button
              type="button"
              onClick={onOpenAlerts}
              title="Configure Civic Alerts & Notifications"
              aria-label="Open Civic Proximity and Policy Alerts Dialog"
              className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors relative focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E63946] rounded-full" aria-hidden="true" />
            </button>

            {/* Resident Voice / Micro-Survey Button */}
            {onOpenMicroSurvey && (
              <button
                type="button"
                onClick={onOpenMicroSurvey}
                title="Cast Resident Vote / Zero-Party Micro-Survey"
                aria-label="Open Resident Voice and Zero-Party Survey Dialog"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1.5 border border-[#2D6A4F]/40 bg-[#2D6A4F]/10 hover:bg-[#2D6A4F] text-[#2D6A4F] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              >
                <Vote className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Resident Voice</span>
              </button>
            )}

            {/* Social Media Dispatch Button */}
            {onOpenSocialDispatch && (
              <button
                type="button"
                onClick={onOpenSocialDispatch}
                title="Broadcast Municipal Dockets to Social Media"
                aria-label="Open Social Media Multi-Channel Dispatch"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1.5 border border-[#1A1A1A]/30 bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-[#FDFDFC] transition-colors focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
                <span className="hidden md:inline">Social Dispatch</span>
              </button>
            )}

            {/* Bot Studio (HITL) Button */}
            {onOpenBotStudio && (
              <button
                type="button"
                onClick={onOpenBotStudio}
                title="Open Civic Bot Moderation Studio (Human-In-The-Loop)"
                aria-label="Open Civic Bot Moderation Studio"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1.5 border border-amber-600/40 bg-amber-500/10 hover:bg-amber-600 text-amber-900 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-600"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span className="hidden xl:inline">Bot Studio</span>
                <span className="px-1 py-0.2 bg-amber-500/20 text-[10px] font-mono rounded">HITL</span>
              </button>
            )}

            {/* Civic Co-Pilot Trigger */}
            <button
              type="button"
              onClick={onToggleCopilot}
              aria-label="Toggle Civic Co-Pilot AI Assistant Drawer"
              aria-expanded={isCopilotOpen}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 border transition-all focus-visible:ring-2 focus-visible:ring-[#1A1A1A] ${
                isCopilotOpen
                  ? 'bg-[#1A1A1A] text-[#FDFDFC] border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFDFC]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Co-Pilot</span>
            </button>

            {/* Resident Profile & Address Location Trigger */}
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                title="Manage Resident Profile & Home Address"
                aria-label="Open Resident Profile and Address Location Settings"
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 border transition-all focus-visible:ring-2 focus-visible:ring-[#2D6A4F] ${
                  userProfile
                    ? 'bg-[#2D6A4F]/10 border-[#2D6A4F]/40 text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white'
                    : 'bg-[#F2F0EA] border-[#1A1A1A]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {userProfile ? `${userProfile.address.neighborhood || userProfile.address.city} (Ward ${userProfile.address.matchedWardNumber || 'Dist.'})` : 'Find My Ward'}
                </span>
                <span className="sm:hidden">Profile</span>
              </button>
            )}
          </div>
        </div>


        {/* Editorial Navigation Bar */}
        <nav 
          role="navigation" 
          aria-label="Main Navigation"
          className="pt-2.5"
        >
          <div 
            role="tablist" 
            aria-label="Civic Digest Primary Sections"
            className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-widest"
          >
            <button
              type="button"
              role="tab"
              id="tab-nav-digest"
              aria-selected={activeTab === 'digest'}
              onClick={() => onSelectTab('digest')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none ${
                activeTab === 'digest'
                  ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#1A1A1A]/30'
              }`}
            >
              News &amp; Feed
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-meetings"
              aria-selected={activeTab === 'meetings'}
              onClick={() => onSelectTab('meetings')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none ${
                activeTab === 'meetings'
                  ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#1A1A1A]/30'
              }`}
            >
              The Docket &amp; Agendas
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-perspectives"
              aria-selected={activeTab === 'perspectives'}
              onClick={() => onSelectTab('perspectives')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none ${
                activeTab === 'perspectives'
                  ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#1A1A1A]/30'
              }`}
            >
              Perspectives
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-sentiment"
              aria-selected={activeTab === 'sentiment'}
              onClick={() => onSelectTab('sentiment')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none ${
                activeTab === 'sentiment'
                  ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#1A1A1A]/30'
              }`}
            >
              <span>Resident Pulse</span>
              <span className="text-[9px] bg-[#1A1A1A] text-[#FDFDFC] px-1 py-0.2 font-mono" aria-label="Differential Privacy Protected">
                ε-DP
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-accountability"
              aria-selected={activeTab === 'accountability'}
              onClick={() => onSelectTab('accountability')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none ${
                activeTab === 'accountability'
                  ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#1A1A1A]/30'
              }`}
            >
              Accountability
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-scanner"
              aria-selected={activeTab === 'scanner'}
              onClick={() => onSelectTab('scanner')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:outline-none ${
                activeTab === 'scanner'
                  ? 'border-[#E63946] text-[#E63946] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#E63946]/30'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#E63946]" aria-hidden="true" />
              <span>Docket Scanner</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-nav-policy-intel"
              aria-selected={activeTab === 'policy_intel'}
              onClick={() => onSelectTab('policy_intel')}
              className={`pb-1.5 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:outline-none ${
                activeTab === 'policy_intel'
                  ? 'border-[#2D6A4F] text-[#2D6A4F] opacity-100'
                  : 'border-transparent text-[#1A1A1A] opacity-60 hover:opacity-100 hover:border-[#2D6A4F]/30'
              }`}
            >
              <FileText className="w-3 h-3 text-[#2D6A4F]" aria-hidden="true" />
              <span>Council Briefs &amp; Intel</span>
            </button>
          </div>
        </nav>


      </div>
    </header>
  );
};

