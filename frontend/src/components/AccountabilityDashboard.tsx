/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Mail,
  Phone
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { OFFICIALS, POLICY_CORRELATIONS } from '../data/mockData';

interface AccountabilityDashboardProps {
  selectedWardId: string;
}

export const AccountabilityDashboard: React.FC<AccountabilityDashboardProps> = () => {
  const [selectedCorrelationIdx, setSelectedCorrelationIdx] = useState<number>(0);
  const activeCorrelation = POLICY_CORRELATIONS[selectedCorrelationIdx] || POLICY_CORRELATIONS[0];

  return (
    <div className="space-y-6">
      
      {/* Overview Masthead */}
      <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 bg-[#1A1A1A] text-[#FDFDFC]">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1A1A1A]">
                Legislative Accountability &amp; Outcome Audits
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#555] max-w-3xl font-sans leading-relaxed">
              Auditing council member roll-call histories, tracking consent calendar voting shares, and correlating enacted municipal ordinances with empirical neighborhood sentiment indicators.
            </p>
          </div>

          {/* Consent Calendar Metric Badge */}
          <div className="bg-[#F2F0EA] border border-[#1A1A1A]/20 p-4 flex items-center gap-3">
            <div className="p-2 bg-[#1A1A1A] text-[#FDFDFC]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777] block font-mono">
                Consent Calendar Audit
              </span>
              <span className="text-base font-serif font-bold text-[#1A1A1A]">
                84.2% Bulk Approvals
              </span>
              <span className="text-[10px] text-[#555] block font-mono">
                CivicDigest Clerk Verification Pipeline
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy-to-Outcome Longitudinal Correlation Tracker */}
      <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#1A1A1A]/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E63946] flex items-center gap-1 mb-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              Longitudinal Outcome Audit
            </span>
            <h3 className="text-xl font-serif font-medium text-[#1A1A1A]">
              {activeCorrelation.policyTitle}
            </h3>
            <p className="text-xs text-[#555] font-mono">
              Metric: {activeCorrelation.metricTracked} (Monthly Ward Average)
            </p>
          </div>

          {/* Selector for which policy correlation to view */}
          <div className="flex items-center gap-2">
            {POLICY_CORRELATIONS.map((c, idx) => (
              <button
                key={c.policyBillId}
                onClick={() => setSelectedCorrelationIdx(idx)}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                  selectedCorrelationIdx === idx
                    ? 'bg-[#1A1A1A] text-[#FDFDFC] border-[#1A1A1A]'
                    : 'bg-[#FDFDFC] text-[#1A1A1A] border-[#1A1A1A]/30 hover:bg-[#F2F0EA]'
                }`}
              >
                Case #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeCorrelation.trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#1A1A1A" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="#1A1A1A" fontSize={11} domain={[0, 10]} fontFamily="JetBrains Mono" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                formatter={(value: any) => [`${value} pts`, 'Indicator Score']}
              />
              <Line 
                type="monotone" 
                dataKey="metricValue" 
                stroke="#1A1A1A" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#1A1A1A', strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Key Finding Note */}
        <div className="mt-4 p-4 bg-[#F2F0EA] border-l-4 border-[#2D6A4F] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[10px] font-mono block mb-0.5">
              Empirical Neighborhood Impact Finding
            </span>
            <p className="text-xs text-[#333] leading-relaxed font-serif italic">
              "{activeCorrelation.measuredImpactSummary}"
            </p>
          </div>
        </div>
      </div>

      {/* Elected Officials Roll Call & Voting Records Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
          <h3 className="font-serif font-medium text-xl text-[#1A1A1A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1A1A1A]" />
            Elected Council Members &amp; Voting Profiles
          </h3>
          <span className="text-[10px] text-[#777] font-mono uppercase tracking-wider">
            OCD-Person Standard v3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {OFFICIALS.map((person) => (
            <div
              key={person.id}
              className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-5 shadow-xs flex flex-col justify-between hover:border-[#1A1A1A] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-serif font-bold text-lg text-[#1A1A1A]">
                      {person.name}
                    </h4>
                    <span className="text-xs text-[#555] font-mono font-medium block">
                      {person.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#F2F0EA] text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5">
                    {person.id.split('/')[1]}
                  </span>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-2 bg-[#F2F0EA] p-2.5 border border-[#1A1A1A]/10 text-center mb-3 text-xs">
                  <div>
                    <span className="text-[9px] text-[#777] uppercase font-bold tracking-wider font-mono block">Attendance</span>
                    <span className="font-bold font-mono text-[#2D6A4F] text-sm">{person.votingAttendanceRate}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#777] uppercase font-bold tracking-wider font-mono block">Sponsored</span>
                    <span className="font-bold font-mono text-[#1A1A1A] text-sm">{person.sponsoredBillsCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#777] uppercase font-bold tracking-wider font-mono block" title="Frequency of voting YES on bulk consent calendar items">Consent Yes</span>
                    <span className="font-bold font-mono text-[#E63946] text-sm">{person.consentVoteRate}%</span>
                  </div>
                </div>

                {/* Priorities */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[9px] uppercase font-bold text-[#777] block tracking-widest font-mono">
                    Key Policy Focus Areas
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {person.keyPriorities.map((p) => (
                      <span key={p} className="text-[10px] font-mono bg-[#FDFDFC] border border-[#1A1A1A]/20 text-[#333] px-2 py-0.5">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Footer */}
              <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs text-[#555]">
                <a
                  href={`mailto:${person.email}`}
                  className="hover:text-[#1A1A1A] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 font-mono"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email Office</span>
                </a>
                {person.phone && (
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Phone className="w-3 h-3" />
                    {person.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

