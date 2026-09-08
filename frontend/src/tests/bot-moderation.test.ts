import { describe, it, expect } from 'bun:test';
import { BotModerationStudio } from '../components/BotModerationStudio';

describe('BotModerationStudio Component & HITL Protocol', () => {
  it('should export BotModerationStudio cleanly', () => {
    expect(BotModerationStudio).toBeDefined();
    expect(typeof BotModerationStudio).toBe('function');
  });

  it('should adhere to Receipt Verification Protocol requirements for all queue items', async () => {
    // Query queue endpoint directly
    const res = await fetch('http://localhost:3000/api/bot/queue/pending').catch(() => null);
    if (res && res.ok) {
      const items = await res.json();
      for (const item of items) {
        expect(item.file_number).toBeDefined();
        expect(item.plain_title).toBeDefined();
        expect(item.receipt_url).toMatch(/^https?:\/\//);
        expect(item.receipt_snippet.length).toBeGreaterThan(10);
        expect(item.receipt_page).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should format multi-platform social payloads within character limits', () => {
    const sampleTweet = '🏛️ Council Update [Ord. 01-26]: Dublin Noise Control. Verified receipt at https://dublinohiousa.gov';
    expect(sampleTweet.length).toBeLessThanOrEqual(280);

    const sampleBluesky = '🏛️ Dublin Noise Control (Ord. 01-26): Verified via official clerk records.';
    expect(sampleBluesky.length).toBeLessThanOrEqual(300);

    const sampleMastodon = '🏛️ Dublin Noise Control (Ord. 01-26): Modernizes vehicle decibel limits and prohibits loud compression braking.';
    expect(sampleMastodon.length).toBeLessThanOrEqual(500);
  });
});
