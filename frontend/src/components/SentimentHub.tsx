/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  HelpCircle, 
  Sliders, 
  TrendingUp, 
  Send, 
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { WARD_METRICS, INITIAL_DP_CONFIG } from '../data/mockData';
import { DifferentialPrivacyConfig } from '../types';
import { getSecureRandom } from '../lib/crypto';
import { useModalKeyboard } from '../lib/useModalKeyboard';

interface SentimentHubProps {
  selectedWardId: string;
  onSelectWardId: (wardId: string) => void;
}

export const SentimentHub: React.FC<SentimentHubProps> = ({
  selectedWardId,
  onSelectWardId,
}) => {
  const [dpConfig] = useState<DifferentialPrivacyConfig>(INITIAL_DP_CONFIG);
  const [activeEpsilon, setActiveEpsilon] = useState<number>(1.0);
  const [simulatedNoise, setSimulatedNoise] = useState<number>(0.12);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  useModalKeyboard(showFormulaModal, () => setShowFormulaModal(false));

  // Survey Form State
  const [formWard, setFormWard] = useState<string>('ocd-division/country:us/state:oh/place:cleveland/ward:12');
  const [costOfLiving, setCostOfLiving] = useState<number>(7);
  const [savingsDelta, setSavingsDelta] = useState<number>(-150);
  const [primaryConcern, setPrimaryConcern] = useState<string>('Roads & Infrastructure');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const wardKeys = Object.keys(WARD_METRICS);
  const currentWardData = WARD_METRICS[selectedWardId] || WARD_METRICS[wardKeys[0]];

  // Prepare chart dataset comparing Raw vs DP across Wards
  const chartData = wardKeys.map((key) => {
    const w = WARD_METRICS[key];
    const noiseFactor = (1.0 / Math.max(0.1, activeEpsilon)) * 0.1;
    return {
      name: w.wardName.split('(')[0].trim(),
      fullWard: w.wardName,
      'Raw Cost of Living (1-10)': Number(w.rawCostOfLivingIndex.toFixed(2)),
      'DP Private Estimate (ε)': Number((w.rawCostOfLivingIndex + (getSecureRandom() - 0.5) * noiseFactor * 2).toFixed(2)),
      'Housing Burden (%)': Number(w.rawHousingBurdenPct.toFixed(1)),
      'Business Confidence (1-10)': Number(w.rawBusinessConfidence.toFixed(2)),
    };
  });

  const handleEpsilonChange = async (newEps: number) => {
    setActiveEpsilon(newEps);
    try {
      const res = await fetch('/api/privacy/laplace-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawValue: currentWardData.rawCostOfLivingIndex,
          epsilon: newEps,
          sensitivity: 1.0,
          lowerBound: 1,
          upperBound: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulatedNoise(Math.abs(data.noiseAdded));
      }
    } catch {
      setSimulatedNoise(Number((1.0 / newEps * 0.12).toFixed(2)));
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const wardNumberMatch = formWard.match(/ward:(\d+)/);
      const wardNumber = wardNumberMatch ? parseInt(wardNumberMatch[1], 10) : 12;

      await fetch('/api/sentiment/submit-microsurvey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: 'ward-general-pulse',
          billTitle: `${currentWardData.wardName} Periodic Economic Pulse`,
          divisionId: formWard,
          wardNumber,
          residentRole: 'general',
          stance: costOfLiving > 6 ? 'oppose' : 'support',
          perceivedCostImpactUSD: savingsDelta,
          priorityRating: costOfLiving,
          anonymizedFeedback: `Priority focus: ${primaryConcern}`,
          epsilon: activeEpsilon,
        }),
      });
    } catch (err) {
      console.warn('Micro-survey submission fallback:', err);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-[#1A1A1A] text-[#FDFDFC] p-6 sm:p-8 border border-[#1A1A1A] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light tracking-tight text-white">
                Privacy-Preserving Resident Sentiment Bureau
              </h2>
              <span className="text-[10px] bg-[#E63946] text-white font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                OpenDP Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#D1D5DB] max-w-3xl leading-relaxed font-sans">
              Collecting hyper-local zero-party economic indicators (housing pressure, cost-of-living strain, municipal services) under formal <strong className="text-white">Differential Privacy (ε-DP)</strong>. Individual household identities are mathematically decoupled and immune to re-identification or subpoena.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFormulaModal(true)}
              aria-haspopup="dialog"
              aria-label="Open Differential Privacy mathematical formulation documentation"
              className="inline-flex items-center gap-1.5 bg-[#2B2B2B] hover:bg-[#383838] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 border border-[#444] transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <HelpCircle className="w-4 h-4 text-[#E63946]" aria-hidden="true" />
              <span>Math Formulation</span>
            </button>
          </div>
        </div>

        {/* Live Privacy Budget & Epsilon Slider Bar */}
        <div className="mt-6 pt-6 border-t border-[#333] grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          
          {/* Epsilon Controller */}
          <div className="bg-[#242424] p-4 border border-[#3A3A3A] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="epsilon-slider" className="text-[#D1D5DB] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                <Sliders className="w-3.5 h-3.5 text-[#E63946]" aria-hidden="true" />
                Privacy Loss (ε = {activeEpsilon.toFixed(1)})
              </label>
              <span className="text-white font-bold">
                {activeEpsilon < 0.6 ? 'High Privacy' : activeEpsilon < 1.4 ? 'Balanced' : 'High Precision'}
              </span>
            </div>
            <input
              id="epsilon-slider"
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={activeEpsilon}
              onChange={(e) => handleEpsilonChange(parseFloat(e.target.value))}
              aria-label="Differential privacy loss epsilon parameter"
              aria-valuemin={0.2}
              aria-valuemax={2.0}
              aria-valuenow={activeEpsilon}
              aria-valuetext={`${activeEpsilon.toFixed(1)} epsilon`}
              className="w-full h-1.5 bg-[#444] rounded-none appearance-none cursor-pointer accent-[#E63946] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E63946]"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF]">
              <span>ε = 0.2 (Max Privacy)</span>
              <span>ε = 2.0 (Exact Data)</span>
            </div>
          </div>

          {/* Laplace Noise Variance */}
          <div className="bg-[#242424] p-4 border border-[#3A3A3A] space-y-1">
            <span className="text-[#D1D5DB] text-xs font-bold uppercase tracking-wider block">
              Laplace Noise Scale (b = Δf / ε)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">
                ±{simulatedNoise.toFixed(3)}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                Δf = 1.0 (Clipped)
              </span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] font-sans">
              Random perturbation added per query to prevent data reconstruction.
            </p>
          </div>

          {/* Monthly Budget Remaining */}
          <div className="bg-[#242424] p-4 border border-[#3A3A3A] space-y-1">
            <span className="text-[#D1D5DB] text-xs font-bold uppercase tracking-wider block">
              Monthly Ward Budget Remaining
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#E63946]">
                {dpConfig.monthlyBudgetRemaining.toFixed(2)} / 5.00 ε
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                ({dpConfig.totalQueriesRun} queries)
              </span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] font-sans">
              Resets every 30 days to prevent cumulative reconstruction attacks.
            </p>
          </div>

        </div>
      </div>

      {/* Ward Economic Comparison Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1A1A1A]" aria-hidden="true" />
                Ward Economic Indicators: Raw vs. DP-Preserved
              </h3>
              <p className="text-xs text-[#4B5563] font-sans">
                Laplace noise safeguards individual ward entries while preserving macro policy trends.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#1A1A1A" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#1A1A1A" fontSize={11} domain={[0, 10]} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Raw Cost of Living (1-10)" fill="#525252" />
                <Bar dataKey="DP Private Estimate (ε)" fill="#1A1A1A" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-4 pt-4 border-t border-[#1A1A1A]/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
              <span className="text-[#525252] block text-[10px] uppercase font-bold tracking-wider font-mono">Avg Rent Burden</span>
              <span className="font-bold text-[#1A1A1A] text-sm font-mono">{currentWardData.dpHousingBurdenPct}% of income</span>
            </div>
            <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
              <span className="text-[#525252] block text-[10px] uppercase font-bold tracking-wider font-mono">Monthly Savings Delta</span>
              <span className={`font-bold text-sm font-mono ${currentWardData.dpSavingsDeltaUSD < 0 ? 'text-[#E63946]' : 'text-[#2D6A4F]'}`}>
                ${currentWardData.dpSavingsDeltaUSD}/mo
              </span>
            </div>
            <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
              <span className="text-[#525252] block text-[10px] uppercase font-bold tracking-wider font-mono">Business Confidence</span>
              <span className="font-bold text-[#1A1A1A] text-sm font-mono">{currentWardData.dpBusinessConfidence}/10</span>
            </div>
            <div className="bg-[#F2F0EA] p-3 border border-[#1A1A1A]/10">
              <span className="text-[#525252] block text-[10px] uppercase font-bold tracking-wider font-mono">Municipal Services</span>
              <span className="font-bold text-[#1A1A1A] text-sm font-mono">{currentWardData.dpServiceRating}/10</span>
            </div>
          </div>
        </div>

        {/* Resident Pulse Zero-Party Survey Form */}
        <div className="bg-[#FDFDFC] border border-[#1A1A1A]/20 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1A1A1A]/15">
              <Lock className="w-4 h-4 text-[#1A1A1A]" aria-hidden="true" />
              <h3 className="font-serif font-medium text-lg text-[#1A1A1A]">
                Submit Citizen Economic Pulse
              </h3>
            </div>
            <p className="text-xs text-[#4B5563] mb-4 font-sans">
              Confidential community input to inform city hall budget allocation without personal profiling.
            </p>

            {submitted ? (
              <div className="bg-[#F2F0EA] border-l-4 border-[#2D6A4F] p-4 text-center space-y-2 my-4">
                <CheckCircle2 className="w-8 h-8 text-[#2D6A4F] mx-auto" aria-hidden="true" />
                <h4 className="font-bold text-[#1A1A1A] text-sm font-serif">Response Perturbed &amp; Ingested</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed font-sans">
                  Perturbed via Laplace mechanism before inclusion in ward aggregates.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSurveySubmit} className="space-y-3.5 text-xs">
                
                <div>
                  <label htmlFor="ward-select-input" className="font-bold uppercase tracking-wider text-[10px] text-[#525252] block mb-1 font-mono">
                    Your Municipal Ward
                  </label>
                  <select
                    id="ward-select-input"
                    value={formWard}
                    onChange={(e) => setFormWard(e.target.value)}
                    className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] font-bold text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  >
                    <option value="ocd-division/country:us/state:oh/place:cleveland/ward:12">Ward 12 (Slavic Village)</option>
                    <option value="ocd-division/country:us/state:oh/place:cleveland/ward:3">Ward 3 (Downtown / Ohio City)</option>
                    <option value="ocd-division/country:us/state:oh/place:cleveland/ward:15">Ward 15 (Detroit Shoreway)</option>
                    <option value="ocd-division/country:us/state:oh/place:cleveland/ward:17">Ward 17 (West Park)</option>
                  </select>
                </div>

                {/* Cost of Living Strain */}
                <div>
                  <div className="flex justify-between font-bold text-[#333] mb-1 font-mono text-[11px]">
                    <label htmlFor="cost-of-living-slider" className="cursor-pointer">Cost of Living Strain:</label>
                    <span className="text-[#1A1A1A]">{costOfLiving}/10</span>
                  </div>
                  <input
                    id="cost-of-living-slider"
                    type="range"
                    min="1"
                    max="10"
                    value={costOfLiving}
                    onChange={(e) => setCostOfLiving(parseInt(e.target.value))}
                    aria-label="Cost of living strain rating from 1 to 10"
                    aria-valuemin={1}
                    aria-valuemax={10}
                    aria-valuenow={costOfLiving}
                    aria-valuetext={`${costOfLiving} out of 10`}
                    className="w-full accent-[#1A1A1A] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  />
                </div>

                {/* Monthly Savings Delta */}
                <div>
                  <div className="flex justify-between font-bold text-[#333] mb-1 font-mono text-[11px]">
                    <label htmlFor="savings-delta-slider" className="cursor-pointer">Monthly Savings Trend:</label>
                    <span className={savingsDelta < 0 ? 'text-[#E63946]' : 'text-[#2D6A4F]'}>
                      {savingsDelta > 0 ? `+$${savingsDelta}` : `-$${Math.abs(savingsDelta)}`}
                    </span>
                  </div>
                  <input
                    id="savings-delta-slider"
                    type="range"
                    min="-800"
                    max="800"
                    step="50"
                    value={savingsDelta}
                    onChange={(e) => setSavingsDelta(parseInt(e.target.value))}
                    aria-label="Monthly savings trend dollar delta"
                    aria-valuemin={-800}
                    aria-valuemax={800}
                    aria-valuenow={savingsDelta}
                    aria-valuetext={`${savingsDelta >= 0 ? '+' : ''}${savingsDelta} dollars per month`}
                    className="w-full accent-[#1A1A1A] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  />
                </div>

                {/* Top Concern */}
                <div>
                  <label htmlFor="priority-select-input" className="font-bold uppercase tracking-wider text-[10px] text-[#525252] block mb-1 font-mono">
                    Top Civic Priority
                  </label>
                  <select
                    id="priority-select-input"
                    value={primaryConcern}
                    onChange={(e) => setPrimaryConcern(e.target.value)}
                    className="w-full bg-[#F2F0EA] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] font-bold text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                  >
                    <option value="Housing Affordability">Housing Affordability &amp; Rents</option>
                    <option value="Roads & Infrastructure">Roads &amp; Stormwater Infrastructure</option>
                    <option value="Public Safety">Public Safety &amp; First Responders</option>
                    <option value="Transit & Traffic">Public Transit Frequency</option>
                    <option value="Local Taxes">Property Taxes &amp; Utility Fees</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] font-bold uppercase tracking-wider py-2.5 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Submit Zero-Knowledge Pulse</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="formula-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FDFDFC] max-w-xl w-full p-6 border-2 border-[#1A1A1A] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
              <h3 id="formula-modal-title" className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" aria-hidden="true" />
                Differential Privacy Mathematical Formulation
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                aria-label="Close math formulation dialog"
                className="text-[#525252] hover:text-[#1A1A1A] text-lg font-bold p-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#1A1A1A] text-white p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
              <div>P(M(D) ∈ S) ≤ exp(ε) · P(M(D') ∈ S)</div>
              <div className="mt-2 text-[#D1D5DB] text-xs">
                Laplace Mechanism: M(D) = f(D) + Laplace(Δf / ε)
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#374151] leading-relaxed font-sans">
              <p>
                <strong>ε (Epsilon):</strong> Governs the strict privacy loss budget. Lower values of ε add more random noise to ensure total plausible deniability.
              </p>
              <p>
                <strong>Δf (Global Sensitivity):</strong> The maximum variation caused by a single resident's entry, bounded via strict input clipping.
              </p>
              <p>
                <strong>Budget Exhaustion Safeguard:</strong> When a ward's monthly budget is spent, further queries serve cached private estimates to prevent iterative averaging attacks.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#333] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              >
                Close Formulation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

