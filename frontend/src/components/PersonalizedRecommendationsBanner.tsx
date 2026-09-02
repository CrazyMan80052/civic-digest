import React from 'react';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Sliders, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Building,
  Home,
  Briefcase,
  Compass
} from 'lucide-react';
import { UserProfile, OCDJurisdiction, OCDPerson } from '../types';

interface PersonalizedRecommendationsBannerProps {
  profile: UserProfile | null;
  onOpenProfileModal: () => void;
  isPersonalizedOnly: boolean;
  onTogglePersonalizedOnly: (enabled: boolean) => void;
  recommendedCount: number;
  jurisdiction: OCDJurisdiction;
}

export const PersonalizedRecommendationsBanner: React.FC<PersonalizedRecommendationsBannerProps> = ({
  profile,
  onOpenProfileModal,
  isPersonalizedOnly,
  onTogglePersonalizedOnly,
  recommendedCount,
  jurisdiction,
}) => {
  if (!profile) {
    return (
      <div className="bg-white border border-[#2D6A4F]/20 rounded-lg p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F] shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Enter your home address to personalize your civic digest</h3>
              <span className="px-1.5 py-0.5 bg-[#E63946]/10 text-[#E63946] text-[10px] font-bold uppercase tracking-wider rounded">New</span>
            </div>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
              Automatically identify your city council ward, representative, and filter dockets that directly impact your neighborhood.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded hover:bg-[#2D6A4F]/90 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
        >
          <Compass className="w-3.5 h-3.5" />
          Set Home Address &amp; Profile
        </button>
      </div>
    );
  }

  const roleLabelMap: Record<string, string> = {
    homeowner: 'Homeowner',
    renter: 'Renter / Tenant',
    small_business: 'Small Business Owner',
    commuter: 'Daily Commuter',
    parent: 'Parent / Family',
    student: 'Student',
    senior: 'Senior Citizen',
    general: 'Resident',
  };

  return (
    <div className="bg-white border border-[#1A1A1A]/15 rounded-lg p-4 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Profile Summary & Ward Badge */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#1A1A1A]">{profile.fullName}</span>
              <span className="text-xs px-2 py-0.5 bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.address.neighborhood || profile.address.city} (Ward {profile.address.matchedWardNumber || 'District'})
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-[#F4F1EA] text-[#1A1A1A]/80 font-medium rounded-full">
                {roleLabelMap[profile.residentRole] || profile.residentRole}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#1A1A1A]/70 mt-1">
              <span className="font-mono text-[11px]">📍 {profile.address.streetAddress || profile.address.rawInput}</span>
              <span>•</span>
              <span>Rep: <strong className="text-[#1A1A1A]">{profile.address.councilMemberName || 'Council Member'}</strong></span>
              {profile.address.councilMemberEmail && (
                <a 
                  href={`mailto:${profile.address.councilMemberEmail}`}
                  className="text-[#2D6A4F] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Mail className="w-3 h-3" />
                  Email Rep
                </a>
              )}
            </div>

            {/* Selected Priorities Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] uppercase font-mono text-[#1A1A1A]/50">Your Priorities:</span>
              {profile.policyPriorities.slice(0, 4).map((p) => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 bg-[#F4F1EA] text-[#1A1A1A] rounded border border-[#1A1A1A]/10">
                  {p}
                </span>
              ))}
              {profile.policyPriorities.length > 4 && (
                <span className="text-[10px] text-[#1A1A1A]/50 font-medium">+{profile.policyPriorities.length - 4} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Personalized Filter Switch & Actions */}
        <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
          <button
            onClick={() => onTogglePersonalizedOnly(!isPersonalizedOnly)}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 border transition-all ${
              isPersonalizedOnly
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                : 'bg-[#F4F1EA] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#2D6A4F]/40'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isPersonalizedOnly ? 'text-white' : 'text-[#2D6A4F]'}`} />
            <span>{isPersonalizedOnly ? 'Showing Recommended for You' : 'Filter by My Profile'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isPersonalizedOnly ? 'bg-white/20 text-white' : 'bg-[#1A1A1A]/10 text-[#1A1A1A]'
            }`}>
              {recommendedCount}
            </span>
          </button>

          <button
            onClick={onOpenProfileModal}
            className="px-3 py-1.5 text-xs font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F4F1EA] border border-[#1A1A1A]/15 rounded transition-colors flex items-center gap-1.5"
            title="Edit address, civic role, or policy priorities"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

      </div>
    </div>
  );
};
