/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Open Civic Data (OCD-ID) Standardized Entities
export interface OCDJurisdiction {
  id: string; // e.g. "ocd-jurisdiction/country:us/state:oh/place:cleveland/government"
  name: string;
  state: string;
  level: 'city' | 'county' | 'state';
  legistarClient: string;
  divisions: OCDDivision[];
}

export interface OCDDivision {
  id: string; // e.g. "ocd-division/country:us/state:oh/place:cleveland/ward:12"
  name: string;
  type: 'ward' | 'district' | 'at-large';
  representativeId?: string;
  population?: number;
}

export interface OCDPerson {
  id: string; // e.g. "ocd-person/9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
  name: string;
  title: string;
  divisionId: string;
  partyAffiliation?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  votingAttendanceRate: number; // percentage (e.g. 96.5)
  sponsoredBillsCount: number;
  consentVoteRate: number; // rate of voting Yes on consent calendar items
  keyPriorities: string[];
}

export type BillStatus = 
  | 'Introduced' 
  | 'In Committee' 
  | 'Passed' 
  | 'Failed' 
  | 'Tabled' 
  | 'Enacted' 
  | 'Under Review';

export type PolicyCategory = 
  | 'Zoning & Housing'
  | 'Infrastructure & Public Works'
  | 'Budget & Finance'
  | 'Public Safety'
  | 'Environment & Parks'
  | 'Small Business & Commerce'
  | 'Transportation & Transit'
  | 'Health & Human Services';

export interface VoteRecord {
  personId: string;
  personName: string;
  vote: 'Yes' | 'No' | 'Abstain' | 'Absent';
  role: string;
}

export interface ReceiptCitation {
  documentTitle: string;
  officialUrl: string;
  pageNumber?: number;
  paragraphSnippet: string;
  clerkMatterId: string;
  fileNumber: string;
  verificationBadge: 'Verified Official' | 'Clerk Audited' | 'Community Verified';
  verifiedAt: string;
}

export interface MediaPerspective {
  sourceName: string;
  sourceType: 'Daily Newspaper' | 'Local Digital Journal' | 'Investigative Outlet' | 'Business Journal' | 'Community Forum';
  biasRating: 'Left' | 'Center' | 'Right' | 'Local Nonpartisan' | 'Business-focused';
  headline: string;
  articleUrl: string;
  summary: string;
  keyStance: string;
  publishedDate: string;
}

export interface PublicCommentBreakdown {
  totalComments: number;
  supportPercentage: number;
  opposePercentage: number;
  neutralPercentage: number;
  topResidentThemes: {
    theme: string;
    sentiment: 'pro' | 'con' | 'neutral';
    quoteSample: string;
  }[];
}

export interface MultiPerspectiveAnalysis {
  officialDocketStance: {
    sponsorIntent: string;
    legalDepartmentNote: string;
    fiscalReviewNote: string;
  };
  mediaPerspectives: MediaPerspective[];
  publicCommentBreakdown: PublicCommentBreakdown;
  blindspotSummary?: string;
}

export interface OCDBill {
  id: string; // e.g. "ocd-bill/1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  fileNumber: string; // e.g. "882-2026"
  jurisdictionId: string;
  divisionId?: string; // specific ward or citywide
  title: string; // Raw legalese title
  plainTitle: string; // Plain language title
  summary: string; // What it does in plain language
  whoItAffects: string; // Demographic & neighborhood impact
  category: PolicyCategory;
  status: BillStatus;
  isConsentCalendar: boolean;
  introducedDate: string;
  lastActionDate: string;
  fiscalImpact: {
    amount: number;
    fundingSource: string;
    isTaxpayerDirect: boolean;
    description: string;
  };
  sponsors: string[]; // Person IDs or names
  receipt: ReceiptCitation;
  votes?: {
    voteEventId: string;
    date: string;
    passed: boolean;
    yesCount: number;
    noCount: number;
    abstainCount: number;
    absentCount: number;
    records: VoteRecord[];
  };
  perspectives: MultiPerspectiveAnalysis;
  tags: string[];
}

export interface MeetingAgendaItem {
  id: string;
  itemNumber: string;
  billId?: string;
  title: string;
  plainSummary: string;
  department: string;
  actionTaken?: string;
  durationMinutes?: number;
  videoTimestampSeconds?: number;
}

export interface MeetingEvent {
  id: string;
  jurisdictionId: string;
  title: string;
  body: 'City Council' | 'Committee of the Whole' | 'Planning & Zoning Commission' | 'Transportation & Utilities' | 'Finance Committee';
  date: string;
  time: string;
  location: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Adjourned';
  videoUrl?: string;
  officialAgendaPdfUrl: string;
  officialMinutesPdfUrl?: string;
  agendaItems: MeetingAgendaItem[];
  keyDecisionsSummary?: string;
}

// Differential Privacy & Community Economic Sentiment
export interface ResidentSurveySubmission {
  id: string;
  wardId: string;
  submittedAt: string;
  costOfLivingStrain: number; // 1-10 (1 = very manageable, 10 = extreme burden)
  monthlySavingsChangeUSD: number; // clipped to [-1000, 1000]
  rentHousingBurdenPercentage: number; // percentage of income spent on housing
  localBusinessConfidence: number; // 1-10
  municipalServiceRating: number; // 1-10 (e.g. roads, sanitation, transit)
  topConcern: 'Housing Affordability' | 'Roads & Infrastructure' | 'Public Safety' | 'Local Taxes' | 'Transit & Traffic' | 'Small Business Support';
}

export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy loss budget (e.g., 0.5 to 1.5)
  delta: number; // e.g. 1e-5
  globalSensitivity: number; // e.g. 1.0 for normalized indices, 1000 for monetary
  monthlyBudgetRemaining: number; // e.g. 3.2 / 5.0 epsilon
  totalQueriesRun: number;
}

export interface WardEconomicMetrics {
  divisionId: string;
  wardName: string;
  sampleSize: number;
  // Raw vs DP (Differentially Private) Laplace Outputs
  rawCostOfLivingIndex: number;
  dpCostOfLivingIndex: number;
  rawSavingsDeltaUSD: number;
  dpSavingsDeltaUSD: number;
  rawHousingBurdenPct: number;
  dpHousingBurdenPct: number;
  rawBusinessConfidence: number;
  dpBusinessConfidence: number;
  rawServiceRating: number;
  dpServiceRating: number;
  privacyNoiseStdDev: number;
  primaryConcernBreakdown: { [concern: string]: number };
}

// Policy Outcome Correlation (e.g. Ward 12 Upzoning Ordinance vs Housing Sentiment)
export interface PolicyOutcomeCorrelation {
  policyBillId: string;
  policyTitle: string;
  enactedDate: string;
  category: PolicyCategory;
  divisionId: string;
  metricTracked: string;
  trendData: {
    month: string;
    metricValue: number;
    eventMarker?: string;
  }[];
  measuredImpactSummary: string;
}

// Zero-Party Resident Micro-Survey Submission & Aggregation with Differential Privacy
export interface ResidentMicroSurveySubmission {
  id?: string;
  billId?: string;
  billTitle?: string;
  divisionId: string;
  wardNumber: number;
  residentRole: 'homeowner' | 'renter' | 'small_business' | 'commuter' | 'student' | 'general';
  stance: 'support' | 'oppose' | 'amend' | 'neutral';
  perceivedCostImpactUSD: number; // e.g. -50 for savings, +25 for cost
  priorityRating: number; // 1 to 10
  anonymizedFeedback?: string;
  epsilon: number;
  submittedAt: string;
}

export interface MicroSurveyAggregatedResult {
  billId?: string;
  totalVotes: number;
  supportPct: number;
  opposePct: number;
  amendPct: number;
  neutralPct: number;
  rawAvgCostImpactUSD: number;
  dpAvgCostImpactUSD: number;
  rawAvgPriority: number;
  dpAvgPriority: number;
  roleBreakdown: { [role: string]: number };
  sampleStatements: string[];
  privacyGuarantee: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  address: {
    rawInput: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood?: string;
    matchedJurisdictionId: string;
    matchedDivisionId: string; // ward or district OCD-ID
    matchedWardNumber?: number;
    councilMemberName?: string;
    councilMemberId?: string;
    councilMemberEmail?: string;
  };
  residentRole: 'homeowner' | 'renter' | 'small_business' | 'commuter' | 'student' | 'parent' | 'senior' | 'general';
  policyPriorities: string[]; // Policy categories the resident cares most about
  householdSize?: number;
  yearsInCommunity?: number;
  digestFrequency: 'daily' | 'weekly' | 'breaking_only';
  notifyOnWardHearings: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressLookupResult {
  matched: boolean;
  rawInput: string;
  formattedAddress: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  jurisdiction: OCDJurisdiction;
  division: OCDDivision;
  councilMember?: OCDPerson;
  confidence: number;
  explanation: string;
}

export type ActiveTab = 
  | 'digest' 
  | 'meetings' 
  | 'perspectives' 
  | 'sentiment' 
  | 'accountability' 
  | 'scanner'
  | 'policy_intel';

