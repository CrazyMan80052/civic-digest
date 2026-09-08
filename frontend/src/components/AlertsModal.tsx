/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, MapPin, DollarSign, Layers, CheckCircle2, X } from 'lucide-react';
import { useModalKeyboard } from '../lib/useModalKeyboard';

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

  // Accessible keyboard Escape handling and focus return
  useModalKeyboard(isOpen, onClose);

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-modal-title"
        className="bg-[#FDFDFC] max-w-lg w-full border-2 border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col"
      >
        
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#FDFDFC] p-5 flex items-center justify-between border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#FDFDFC] text-[#1A1A1A]">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="alerts-modal-title" className="font-serif font-medium text-lg text-white">
                Civic Proximity &amp; Policy Alerts
              </h3>
              <p className="text-[11px] text-[#D1D5DB] font-sans">
                Targeted notifications for local zoning, major contracts, and hearings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alerts settings dialog"
            className="text-[#D1D5DB] hover:text-white p-1 hover:bg-[#333] transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-sans">
          
          {/* Spatial Proximity */}
          <div className="space-y-3 bg-[#F2F0EA] p-4 border border-[#1A1A1A]/15">
            <div className="flex items-center gap-2 font-serif font-bold text-[#1A1A1A] text-sm">
              <MapPin className="w-4 h-4 text-[#1A1A1A]" aria-hidden="true" />
              <span>Geographic Proximity Boundary</span>
            </div>
            
            <div>
              <label htmlFor="alert-address" className="font-bold uppercase tracking-wider text-[10px] text-[#525252] block mb-1 font-mono">
                Your Residential / Business Address
              </label>
              <input
                id="alert-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 1200 W 65th St, Cleveland OH"
                aria-label="Your Residential or Business Address"
                className="w-full bg-[#FDFDFC] border border-[#1A1A1A]/30 p-2 text-[#1A1A1A] text-xs font-sans focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#1A1A1A] mb-1 font-mono text-xs">
                <label htmlFor="alert-radius-slider">Alert Radius Boundary:</label>
                <span className="text-[#E63946]">{radiusMeters} meters</span>
              </div>
              <input
                id="alert-radius-slider"
                type="range"
                min="200"
                max="2500"
                step="100"
                value={radiusMeters}
                aria-label="Alert radius boundary in meters"
                aria-valuemin={200}
                aria-valuemax={2500}
                aria-valuenow={radiusMeters}
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
                  <Layers className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
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
              <label htmlFor="fiscal-threshold-slider" className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
                Capital Expenditure Alert:
              </label>
              <span className="text-[#2D6A4F]">
                ${(fiscalThreshold / 1000000).toFixed(1)}M+
              </span>
            </div>
            <input
              id="fiscal-threshold-slider"
              type="range"
              min="250000"
              max="5000000"
              step="250000"
              value={fiscalThreshold}
              aria-label="Capital expenditure fiscal alert threshold in dollars"
              aria-valuemin={250000}
              aria-valuemax={5000000}
              aria-valuenow={fiscalThreshold}
              onChange={(e) => setFiscalThreshold(parseInt(e.target.value))}
              className="w-full accent-[#1A1A1A]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between">
            <span className="text-[#525252] text-[10px] font-mono">
              Stored in client profile
            </span>
            <button
              type="submit"
              className="bg-[#1A1A1A] hover:bg-[#333] text-[#FDFDFC] font-bold uppercase tracking-wider text-xs px-5 py-2.5 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
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

