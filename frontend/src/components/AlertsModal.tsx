/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, MapPin, DollarSign, Layers, CheckCircle2, X } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose }) => {
  const [address, setAddress] = useState<string>('5420 Fleet Ave, Slavic Village');
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [zoningAlert, setZoningAlert] = useState<boolean>(true);
  const [fiscalThreshold, setFiscalThreshold] = useState<number>(1000000);
  const [consentAuditAlert, setConsentAuditAlert] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFDFC] max-w-lg w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] p-5 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">
                Civic Proximity &amp; Policy Alerts
              </h3>
              <p className="text-[11px] text-[#aaa] font-sans">
                Targeted notifications for local zoning, major contracts, and hearings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#aaa] hover:text-white p-1 hover:bg-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-sans">
          
          {/* Spatial Proximity */}
          <div className="space-y-3 bg-[#F2F0EA] p-4 border border-[#1A1A1A]/15">
            <div className="flex items-center gap-2 font-serif font-bold text-[#1A1A1A] text-sm">
              <MapPin className="w-4 h-4 text-[#1A1A1A]" />
              <span>Geographic Proximity Boundary</span>
            </div>
            
            <div>
              <label className="font-bold uppercase tracking-wider text-[10px] text-[#777] block mb-1 font-mono">
                Your Residential / Business Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 1200 W 65th St, Cleveland OH"
                className="w-full bg-[#FDFDFC] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] text-xs font-sans"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#1A1A1A] mb-1 font-mono text-xs">
                <span>Alert Radius Boundary:</span>
                <span className="text-[#E63946]">{radiusMeters} meters</span>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="100"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                className="w-full accent-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Policy Trigger Toggles */}
          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-3 border border-[#1A1A1A]/20 bg-[#FDFDFC] hover:bg-[#F2F0EA] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={zoningAlert}
                onChange={(e) => setZoningAlert(e.target.checked)}
                className="mt-0.5 accent-[#1A1A1A] w-4 h-4"
              />
              <div>
                <span className="font-bold text-[#1A1A1A] block text-xs font-serif">
                  Zoning &amp; Land Use Variances
                </span>
                <span className="text-[11px] text-[#555]">
                  Notify me when any rezoning, height variance, or demolition permit is filed within my radius.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-[#1A1A1A]/20 bg-[#FDFDFC] hover:bg-[#F2F0EA] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consentAuditAlert}
                onChange={(e) => setConsentAuditAlert(e.target.checked)}
                className="mt-0.5 accent-[#1A1A1A] w-4 h-4"
              />
              <div>
                <span className="font-bold text-[#1A1A1A] block text-xs flex items-center gap-1.5 font-serif">
                  <Layers className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  Consent Calendar Audits
                </span>
                <span className="text-[11px] text-[#555]">
                  Flag high-impact items slated for bulk approval without standalone committee debate.
                </span>
              </div>
            </label>
          </div>

          {/* Fiscal Threshold */}
          <div className="bg-[#F2F0EA] p-3.5 border border-[#1A1A1A]/15 space-y-1">
            <div className="flex justify-between font-bold text-[#1A1A1A] font-mono text-xs">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]" />
                Capital Expenditure Alert:
              </span>
              <span className="text-[#2D6A4F]">
                ${(fiscalThreshold / 1000000).toFixed(1)}M+
              </span>
            </div>
            <input
              type="range"
              min="250000"
              max="5000000"
              step="250000"
              value={fiscalThreshold}
              onChange={(e) => setFiscalThreshold(parseInt(e.target.value))}
              className="w-full accent-[#1A1A1A]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between">
            <span className="text-[#777] text-[10px] font-mono">
              Stored in client profile
            </span>
            <button
              type="submit"
              className="bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] font-bold uppercase tracking-wider text-xs px-5 py-2.5 flex items-center gap-1.5 transition-colors"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Notification Rules</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

