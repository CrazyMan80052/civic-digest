import { NextResponse, NextRequest } from 'next/server';

interface MockBotPost {
  id: string;
  bill_id: string;
  file_number: string;
  plain_title: string;
  the_what: string;
  the_who: string;
  fiscal_amount: number;
  platform: 'twitter' | 'bluesky' | 'mastodon' | 'webhook';
  status: 'PENDING_MODERATION' | 'QUEUED' | 'PUBLISHED' | 'REJECTED';
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  thread_content: string[];
  card_image_url: string;
  receipt_url: string;
  receipt_snippet: string;
  receipt_page: number;
  moderated_by?: string;
  moderation_notes?: string;
  created_at: string;
}

// In-memory fallback queue for standalone frontend environments
const FALLBACK_QUEUE: MockBotPost[] = [
  {
    id: 'post-dublin-01',
    bill_id: 'ocd-bill/2026-oh-dublin-ord-01-26',
    file_number: 'Ord. 01-26',
    plain_title: 'Dublin Noise Control & Engine Braking Prohibition',
    the_what: 'Modernizes vehicle decibel limits, regulates high-output commercial sound devices, and bans compression engine braking on city thoroughfares.',
    the_who: 'Dublin residents in residential corridors and motorists along I-270 / SR-161.',
    fiscal_amount: 15000,
    platform: 'twitter',
    status: 'PENDING_MODERATION',
    priority: 'MODERATE',
    thread_content: [
      '🏛️ Dublin Council Update [Ord. 01-26]: Dublin Noise Control & Engine Braking Prohibition.\n\nModernizes vehicle decibel limits and prohibits loud compression braking. Affects residential corridors and motorists along I-270.\n\nVerified receipt: https://dublinohiousa.gov/city-council/ #LocalGov',
      '📋 Fiscal Note: $15,000 allocated from Police Operating Fund for decibel testing equipment.\n\nOfficial Citation: Dublin Codified Ordinances Ch. 132 (Page 1).'
    ],
    card_image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338"><rect width="600" height="338" fill="%23111827"/><text x="40" y="80" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold">Dublin City Council</text><text x="40" y="130" fill="%23F3F4F6" font-size="16" font-family="sans-serif">Ord. 01-26: Noise Control</text><text x="40" y="280" fill="%2310B981" font-size="14" font-family="sans-serif">Verified Clerk Record (p. 1)</text></svg>',
    receipt_url: 'https://dublinohiousa.gov/city-council/legislation-minutes/',
    receipt_snippet: 'An Ordinance amending Chapter 132 (Offenses Against Public Peace) to modernize vehicle decibel standards and prohibit compression engine braking.',
    receipt_page: 1,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'post-cleveland-101',
    bill_id: 'ocd-bill/2026-oh-cleveland-ord-101-2026',
    file_number: 'Ord. 101-2026',
    plain_title: 'Slavic Village Fleet Ave Commercial Corridor Revitalization',
    the_what: 'Authorizes $350,000 in matching capital grants for small business facade improvements and pedestrian safety bollards along Fleet Avenue.',
    the_who: 'Ward 12 residents, merchants, and neighborhood storefront owners.',
    fiscal_amount: 350000,
    platform: 'twitter',
    status: 'PENDING_MODERATION',
    priority: 'HIGH',
    thread_content: [
      '🏛️ Cleveland Council [Ord. 101-2026]: $350k Slavic Village Fleet Ave Revitalization approved for committee review.\n\nGrants for small business facades and pedestrian safety bollards. Impacts Ward 12 merchants.\n\nOfficial Docket: https://cleveland.legistar.com/LegislationDetail.aspx?ID=101 #ClevelandGov',
      '💰 Funding Source: Capital Infrastructure Fund ($350,000 direct municipal allocation).\n\nReceipt: Verified Clerk Journal (Page 2, Paragraph 4).'
    ],
    card_image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338"><rect width="600" height="338" fill="%230F172A"/><text x="40" y="80" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold">Cleveland City Council</text><text x="40" y="130" fill="%23F3F4F6" font-size="16" font-family="sans-serif">Ord. 101-2026: Slavic Village $350k</text><text x="40" y="280" fill="%2338BDF8" font-size="14" font-family="sans-serif">Verified Clerk Journal (p. 2)</text></svg>',
    receipt_url: 'https://cleveland.legistar.com/LegislationDetail.aspx?ID=101',
    receipt_snippet: 'Council hereby authorizes an expenditure not to exceed $350,000 from the Capital Improvement Fund for facade modernization and pedestrian improvements.',
    receipt_page: 2,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'post-austin-55',
    bill_id: 'ocd-bill/2026-tx-austin-res-55',
    file_number: 'Res. 2026-55',
    plain_title: 'Urban Heat Island Mitigation & Tree Canopy Tree Protection Standard',
    the_what: 'Requires 30% minimum preserved canopy coverage on commercial developments over 2 acres.',
    the_who: 'Austin commercial developers, environmental commissions, and urban transit corridors.',
    fiscal_amount: 85000,
    platform: 'bluesky',
    status: 'PENDING_MODERATION',
    priority: 'MODERATE',
    thread_content: [
      '🌳 Austin City Council: New Tree Canopy Ordinance (Res. 2026-55) mandates 30% tree preservation on major commercial parcels.\n\nGrounds in clerk environmental docket: https://austintexas.gov/council'
    ],
    card_image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338"><rect width="600" height="338" fill="%23064E3B"/><text x="40" y="80" fill="%23FFFFFF" font-size="22" font-family="sans-serif" font-weight="bold">Austin City Council</text><text x="40" y="130" fill="%23F3F4F6" font-size="16" font-family="sans-serif">Res. 2026-55: Urban Heat Island Canopy</text><text x="40" y="280" fill="%2334D399" font-size="14" font-family="sans-serif">Receipt Verified: Clerk Records</text></svg>',
    receipt_url: 'https://austintexas.gov/council',
    receipt_snippet: 'Directing the City Manager to adopt standard tree protection requirements of no less than 30% canopy retention for commercial tracts exceeding two acres.',
    receipt_page: 1,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  }
];

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

async function tryProxyToBackend(path: string, method: string, body?: unknown) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/bot/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(1200),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline or timeout; fall back to local store
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.route?.join('/') || '';

  // 1. Try forwarding to backend
  const backendData = await tryProxyToBackend(path, 'GET');
  if (backendData !== null) {
    return NextResponse.json(backendData);
  }

  // 2. Local Fallbacks
  if (path === 'queue/pending') {
    const pending = FALLBACK_QUEUE.filter((p) => p.status === 'PENDING_MODERATION');
    return NextResponse.json(pending);
  }

  if (path.startsWith('queue/') && path.endsWith('/preview')) {
    const parts = path.split('/');
    const postId = parts[1];
    const post = FALLBACK_QUEUE.find((p) => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  return NextResponse.json({ status: 'active', path, mode: 'in-memory-fallback' });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.route?.join('/') || '';
  const body = await req.json().catch(() => ({}));

  // 1. Try forwarding to backend
  const backendData = await tryProxyToBackend(path, 'POST', body);
  if (backendData !== null) {
    return NextResponse.json(backendData);
  }

  // 2. Local Fallbacks
  if (path.startsWith('queue/') && path.endsWith('/approve')) {
    const parts = path.split('/');
    const postId = parts[1];
    const post = FALLBACK_QUEUE.find((p) => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    post.status = 'QUEUED';
    post.moderated_by = body.moderator_name || 'Civic Editor';
    post.moderation_notes = body.notes || 'Approved via HITL Moderation Studio';
    return NextResponse.json({ status: 'approved', post_id: postId, post_status: 'QUEUED' });
  }

  if (path.startsWith('queue/') && path.endsWith('/reject')) {
    const parts = path.split('/');
    const postId = parts[1];
    const post = FALLBACK_QUEUE.find((p) => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    post.status = 'REJECTED';
    post.moderated_by = body.moderator_name || 'Civic Editor';
    post.moderation_notes = body.reason || 'Rejected by moderator';
    return NextResponse.json({ status: 'rejected', post_id: postId, post_status: 'REJECTED' });
  }

  if (path === 'override/roll-call-vote') {
    return NextResponse.json({
      status: 'override_recorded',
      record: {
        id: `override-${Date.now()}`,
        bill_id: body.bill_id,
        file_number: body.file_number,
        action: body.action || 'Passed',
        ayes: body.ayes || [],
        nays: body.nays || [],
        notes: body.notes || '',
        verified_at: new Date().toISOString(),
      },
    });
  }

  if (path === 'pipeline/run') {
    const newPost: MockBotPost = {
      id: `post-gen-${Date.now()}`,
      bill_id: `ocd-bill/2026-gen-${body.place_name?.toLowerCase() || 'muni'}`,
      file_number: `Ord. ${Math.floor(Math.random() * 900) + 100}-2026`,
      plain_title: `${body.place_name || 'Municipal'} Infrastructure & Street Repair Program`,
      the_what: 'Authorizes prioritized neighborhood road resurfacing and sidewalk ADA curb ramp installations.',
      the_who: `Residents and transit users across ${body.place_name || 'the city'}.`,
      fiscal_amount: 275000,
      platform: 'twitter',
      status: 'PENDING_MODERATION',
      priority: 'MODERATE',
      thread_content: [
        `🏛️ ${body.place_name || 'City'} Update: Infrastructure and Street Repair Program initiated.\n\nResurfacing prioritized neighborhood roads and adding ADA ramps. Official records verified. #CivicDigest`
      ],
      card_image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338"><rect width="600" height="338" fill="%231E293B"/><text x="40" y="80" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="bold">Municipal Council</text><text x="40" y="130" fill="%23CBD5E1" font-size="15" font-family="sans-serif">Street Repairs & ADA Upgrades</text></svg>',
      receipt_url: 'https://civicdigest.org/receipts',
      receipt_snippet: 'Council authorizes $275,000 for municipal road resurfacing and ADA curb installations.',
      receipt_page: 1,
      created_at: new Date().toISOString(),
    };
    FALLBACK_QUEUE.unshift(newPost);
    return NextResponse.json({
      status: 'success',
      jurisdiction: `${body.place_name || 'Cleveland'}, ${body.state_code || 'OH'}`,
      enqueued_count: 1,
      posts: [{ id: newPost.id, platform: newPost.platform, status: newPost.status, priority: newPost.priority }],
    });
  }

  return NextResponse.json({ status: 'ok', path });
}
