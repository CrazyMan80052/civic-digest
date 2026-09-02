/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { MEETINGS, BILLS } from '../data/mockData';
import { OCDBill } from '../types';

interface MeetingsViewProps {
  onSelectBill: (billId: string) => void;
  onOpenReceipt: (bill: OCDBill) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  onSelectBill,
  onOpenReceipt,
}) => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(MEETINGS[0].id);
  const currentMeeting = MEETINGS.find((m) => m.id === selectedMeetingId) || MEETINGS[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Masthead */}
      <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 bg-[#1A1A1A] text-[#FDFDFC]">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">
                Council Agendas &amp; Hearing Minutes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#555] max-w-3xl font-sans leading-relaxed">
              Official municipal assembly proceedings, itemized roll-call journals, and committee calendar sync via Granicus Legistar feeds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30 px-3 py-1.5 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
              Legistar Ingest Feed: Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Meetings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Meeting Calendar List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#777] px-1 font-mono">
            Council &amp; Committee Docket Calendar
          </h3>

          {MEETINGS.map((meeting) => {
            const isSelected = meeting.id === selectedMeetingId;
            return (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeetingId(meeting.id)}
                className={`p-4 border cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-[#FDFDFC] border-[#1A1A1A]'
                    : 'bg-[#FDFDFC] text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 font-mono ${
                      meeting.status === 'Upcoming'
                        ? isSelected
                          ? 'bg-[#E63946] text-white'
                          : 'bg-[#E63946] text-white'
                        : isSelected
                        ? 'bg-[#333] text-[#ccc]'
                        : 'bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/20'
                    }`}
                  >
                    {meeting.status}
                  </span>
                  <span className={`text-xs font-mono ${isSelected ? 'text-[#aaa]' : 'text-[#777]'}`}>
                    {meeting.date}
                  </span>
                </div>

                <h4 className="text-base font-serif font-medium leading-snug mb-2">
                  {meeting.title}
                </h4>

                <div className={`space-y-1 text-xs ${isSelected ? 'text-[#ccc]' : 'text-[#555]'}`}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{meeting.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{meeting.location}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1A1A1A]/15 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className={isSelected ? 'text-[#E63946]' : 'text-[#1A1A1A]'}>
                    {meeting.agendaItems.length} Agenda Items
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Detailed Meeting Docket & Item Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1A1A1A]/20">
              <div>
                <span className="text-[10px] font-bold text-[#777] uppercase tracking-widest block mb-1 font-mono">
                  {currentMeeting.body}
                </span>
                <h3 className="text-2xl font-serif font-medium text-[#1A1A1A]">
                  {currentMeeting.title}
                </h3>
                <p className="text-xs text-[#555] mt-1 flex flex-wrap items-center gap-3 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#777]" />
                    {currentMeeting.date} at {currentMeeting.time}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#777]" />
                    {currentMeeting.location}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentMeeting.officialAgendaPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#FDFDFC] hover:bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Agenda PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {currentMeeting.officialMinutesPdfUrl && (
                  <a
                    href={currentMeeting.officialMinutesPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Approved Journal</span>
                  </a>
                )}
              </div>
            </div>

            {/* Key Decisions Highlights */}
            {currentMeeting.keyDecisionsSummary && (
              <div className="my-4 bg-[#F2F0EA] border-l-4 border-[#1A1A1A] p-4 text-xs text-[#1A1A1A] space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#777] block font-mono">
                  Executive Summary of Docket Items
                </span>
                <p className="text-xs text-[#333] leading-relaxed font-serif italic">
                  "{currentMeeting.keyDecisionsSummary}"
                </p>
              </div>
            )}

            {/* Agenda Item Line Items */}
            <div className="space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-1.5 font-mono">
                Itemized Order of Business
              </h4>

              {currentMeeting.agendaItems.map((item) => {
                const linkedBill = BILLS.find((b) => b.id === item.billId);

                return (
                  <div
                    key={item.id}
                    className="p-4 border border-[#1A1A1A]/15 bg-[#FDFDFC] hover:bg-[#F2F0EA]/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-[#1A1A1A] text-[#FDFDFC] px-2 py-0.5">
                          Item #{item.itemNumber}
                        </span>
                        <span className="text-xs text-[#777] font-mono">
                          {item.department}
                        </span>
                      </div>

                      {item.actionTaken && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2D6A4F] text-white px-2 py-0.5 font-mono">
                          {item.actionTaken}
                        </span>
                      )}
                    </div>

                    <h5 className="text-base font-serif font-medium text-[#1A1A1A]">
                      {item.title}
                    </h5>

                    <p className="text-xs text-[#555] leading-relaxed font-sans">
                      {item.plainSummary}
                    </p>

                    {/* Linked Bill Card Quick Action */}
                    {linkedBill && (
                      <div className="pt-2 flex items-center justify-between border-t border-[#1A1A1A]/10 text-xs">
                        <span className="text-[#555]">
                          Docket Reference: <strong className="text-[#1A1A1A] font-mono">{linkedBill.fileNumber}</strong> ({linkedBill.category})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenReceipt(linkedBill)}
                            className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#F2F0EA] border border-[#1A1A1A]/30 px-2 py-1 flex items-center gap-1 transition-colors"
                          >
                            Receipt Check
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

