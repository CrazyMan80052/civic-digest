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
  Radio
} from 'lucide-react';
import { OCDJurisdiction, ActiveTab } from '../types';

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
}) => {
  return (
    <header className="bg-[#FDFDFC] text-[#1A1A1A] border-b-2 border-[#1A1A1A] sticky top-0 z-40 transition-colors">
      {/* Top Utility & Masthead Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        
        {/* Masthead Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#1A1A1A]/15">
          
          {/* Main Masthead Logo / Title */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="bg-[#E63946] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest font-mono">
                OCD-ID v3
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#777]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 
              onClick={() => onSelectTab('digest')}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tighter uppercase italic text-[#1A1A1A] cursor-pointer hover:opacity-90 select-none mt-1"
            >
              Civic Digest
            </h1>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#555] mt-0.5">
              Local Governance & Policy Journal • {selectedJurisdiction.name} Bureau
            </p>
          </div>

          {/* Controls Bar: Search, Jurisdiction, Ward, Alerts, Co-Pilot */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative w-44 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dockets, votes..."
                className="w-full bg-[#F2F0EA] text-xs text-[#1A1A1A] pl-8 pr-6 py-1.5 border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] placeholder-[#777] font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-2 text-[10px] text-[#777] hover:text-[#1A1A1A] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Jurisdiction Dropdown */}
            <div className="relative">
              <select
                value={selectedJurisdiction.id}
                onChange={(e) => {
                  const found = jurisdictions.find((j) => j.id === e.target.value);
                  if (found) {
                    onSelectJurisdiction(found);
                    onSelectWardId('all');
                  }
                }}
                className="appearance-none bg-[#FDFDFC] border border-[#1A1A1A] text-xs text-[#1A1A1A] font-bold py-1.5 pl-2.5 pr-7 focus:outline-none cursor-pointer tracking-tight"
              >
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#1A1A1A] absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Ward/District Dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={selectedWardId}
                onChange={(e) => onSelectWardId(e.target.value)}
                className="appearance-none bg-[#F2F0EA] border border-[#1A1A1A]/30 text-xs text-[#1A1A1A] font-medium py-1.5 pl-2.5 pr-7 focus:outline-none cursor-pointer"
              >
                <option value="all">Citywide / All Wards</option>
                {selectedJurisdiction.divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#555] absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Database & Architecture Button */}
            {onOpenDbModal && (
              <button
                onClick={onOpenDbModal}
                title="PostgreSQL Database Architecture & Connection Status"
                className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
              >
                <Database className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span className="hidden lg:inline text-[10px] font-mono">DB</span>
              </button>
            )}

            {/* Scraper Pipeline Button */}
            {onOpenScraper && (
              <button
                onClick={onOpenScraper}
                title="Municipal Scraper & Ingestion Pipeline"
                className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
              >
                <Radio className="w-3.5 h-3.5 text-[#E63946]" />
                <span className="hidden lg:inline text-[10px] font-mono">Scraper</span>
              </button>
            )}

            {/* Proximity Alerts Button */}
            <button
              onClick={onOpenAlerts}
              title="Configure Civic Alerts & Notifications"
              className="p-1.5 text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 transition-colors relative"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E63946] rounded-full" />
            </button>

            {/* Social Media Dispatch Button */}
            {onOpenSocialDispatch && (
              <button
                onClick={onOpenSocialDispatch}
                title="Broadcast Municipal Dockets to Social Media"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1.5 border border-[#1A1A1A]/30 bg-[#F2F0EA] hover:bg-[#1A1A1A] hover:text-[#FDFDFC] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E63946]" />
                <span className="hidden md:inline">Social Dispatch</span>
              </button>
            )}

            {/* Civic Co-Pilot Trigger */}
            <button
              onClick={onToggleCopilot}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 border transition-all ${
                isCopilotOpen
                  ? 'bg-[#1A1A1A] text-[#FDFDFC] border-[#1A1A1A]'
                  : 'bg-[#F2F0EA] text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFDFC]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Co-Pilot</span>
            </button>
          </div>
        </div>

        {/* Editorial Navigation Bar */}
        <nav className="flex items-center gap-4 sm:gap-8 pt-2.5 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-widest">
          <button
            onClick={() => onSelectTab('digest')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'digest'
                ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#1A1A1A]/30'
            }`}
          >
            News & Feed
          </button>

          <button
            onClick={() => onSelectTab('meetings')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'meetings'
                ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#1A1A1A]/30'
            }`}
          >
            The Docket & Agendas
          </button>

          <button
            onClick={() => onSelectTab('perspectives')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'perspectives'
                ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#1A1A1A]/30'
            }`}
          >
            Perspectives
          </button>

          <button
            onClick={() => onSelectTab('sentiment')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sentiment'
                ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#1A1A1A]/30'
            }`}
          >
            <span>Resident Pulse</span>
            <span className="text-[9px] bg-[#1A1A1A] text-[#FDFDFC] px-1 py-0.2 font-mono">
              ε-DP
            </span>
          </button>

          <button
            onClick={() => onSelectTab('accountability')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'accountability'
                ? 'border-[#1A1A1A] text-[#1A1A1A] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#1A1A1A]/30'
            }`}
          >
            Accountability
          </button>

          <button
            onClick={() => onSelectTab('scanner')}
            className={`pb-1.5 whitespace-nowrap transition-all border-b-2 flex items-center gap-1 ${
              activeTab === 'scanner'
                ? 'border-[#E63946] text-[#E63946] opacity-100'
                : 'border-transparent text-[#1A1A1A] opacity-50 hover:opacity-100 hover:border-[#E63946]/30'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#E63946]" />
            <span>Docket Scanner</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

