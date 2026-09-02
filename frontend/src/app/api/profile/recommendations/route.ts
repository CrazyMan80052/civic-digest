import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { profile, bills } = await req.json();
  if (!profile || !bills || !Array.isArray(bills)) {
    return NextResponse.json({ error: 'Profile and bills array required' }, { status: 400 });
  }

  const wardId = profile.address?.matchedDivisionId;
  const userRole = profile.residentRole || 'homeowner';
  const priorities = profile.policyPriorities || ['Zoning & Housing', 'Infrastructure & Public Works'];

  const scored = bills.map((b: any) => {
    let score = 50;
    const reasons: string[] = [];

    if (wardId && b.divisionId === wardId) {
      score += 35;
      reasons.push(`Directly affects your neighborhood (${profile.address?.neighborhood || 'your ward'})`);
    }

    if (priorities.some((p: string) => p.toLowerCase() === (b.category || '').toLowerCase())) {
      score += 25;
      reasons.push(`Matches your priority in ${b.category}`);
    }

    if (userRole === 'renter' && (b.category === 'Zoning & Housing' || b.whoItAffects?.toLowerCase().includes('tenant') || b.whoItAffects?.toLowerCase().includes('renter'))) {
      score += 20;
      reasons.push(`High impact for renters & tenants`);
    } else if (userRole === 'homeowner' && (b.category === 'Infrastructure & Public Works' || b.whoItAffects?.toLowerCase().includes('property') || b.whoItAffects?.toLowerCase().includes('homeowner'))) {
      score += 20;
      reasons.push(`High impact for homeowners & property taxes`);
    } else if (userRole === 'small_business' && (b.category === 'Small Business & Commerce' || b.category === 'Zoning & Housing' || b.whoItAffects?.toLowerCase().includes('business'))) {
      score += 25;
      reasons.push(`Direct commercial corridor & small business impact`);
    } else if (userRole === 'commuter' && (b.category === 'Transportation & Transit' || b.category === 'Infrastructure & Public Works')) {
      score += 25;
      reasons.push(`Impacts transit corridors and street infrastructure`);
    }

    if (b.fiscalImpact && b.fiscalImpact.amount > 1000000) {
      score += 10;
      reasons.push(`Major municipal investment ($${(b.fiscalImpact.amount / 1000000).toFixed(1)}M)`);
    }

    return {
      billId: b.id,
      relevanceScore: Math.min(99, score),
      reasons,
      primaryReason: reasons[0] || 'Relevant municipal docket for your city',
    };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return NextResponse.json({
    profileId: profile.id,
    recommendations: scored,
  });
}
