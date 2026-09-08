import { describe, it, expect } from 'bun:test';
import { GET, POST } from '../app/api/bot/[...route]/route';
import { NextRequest } from 'next/server';

describe('Bot API Proxy & In-Memory Queue', () => {
  it('should fetch pending moderation items', async () => {
    const req = new NextRequest('http://localhost:3000/api/bot/queue/pending');
    const params = Promise.resolve({ route: ['queue', 'pending'] });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    const first = data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('file_number');
    expect(first).toHaveProperty('receipt_url');
    expect(first.status).toBe('PENDING_MODERATION');
  });

  it('should preview a specific post in the queue', async () => {
    const req = new NextRequest('http://localhost:3000/api/bot/queue/post-dublin-01/preview');
    const params = Promise.resolve({ route: ['queue', 'post-dublin-01', 'preview'] });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const post = await response.json();
    expect(post.file_number).toBe('Ord. 01-26');
    expect(post.receipt_snippet).toContain('Offenses Against Public Peace');
  });

  it('should record a manual roll-call vote override', async () => {
    const overridePayload = {
      bill_id: 'ocd-bill/2026-oh-dublin-ord-01-26',
      file_number: 'Ord. 01-26',
      action: 'Passed',
      ayes: ['Mayor Chris Amorose Groomes', 'Cathy De Rosa', 'John Reiner'],
      nays: [],
      notes: 'Unanimous roll call vote verified via Dublin City Council video record.',
    };

    const req = new NextRequest('http://localhost:3000/api/bot/override/roll-call-vote', {
      method: 'POST',
      body: JSON.stringify(overridePayload),
    });
    const params = Promise.resolve({ route: ['override', 'roll-call-vote'] });
    const response = await POST(req, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('override_recorded');
    expect(data.record.ayes).toHaveLength(3);
    expect(data.record.action).toBe('Passed');
  });

  it('should approve a post and transition state to QUEUED', async () => {
    const req = new NextRequest('http://localhost:3000/api/bot/queue/post-cleveland-101/approve', {
      method: 'POST',
      body: JSON.stringify({ moderator_name: 'Lead Editor', notes: 'Verified and approved' }),
    });
    const params = Promise.resolve({ route: ['queue', 'post-cleveland-101', 'approve'] });
    const response = await POST(req, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('approved');
    expect(data.post_status).toBe('QUEUED');
  });
});
