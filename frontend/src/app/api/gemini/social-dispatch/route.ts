import { NextResponse, NextRequest } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { billTitle, fileNumber, summary, whoItAffects, fiscalAmount, category, receiptUrl } = await req.json();
    const ai = getGeminiClient();

    if (!ai) {
      const fiscalText = fiscalAmount > 0 ? ` ($${(fiscalAmount / 1000000).toFixed(1)}M fiscal impact)` : '';
      return NextResponse.json({
        twitter: `🏛️ Council Update [${fileNumber}]: ${billTitle}${fiscalText}. Affects ${whoItAffects}. Read verified receipt: ${receiptUrl || 'https://civicdigest.org'} #LocalGov #CivicTech`,
        bluesky: `🏛️ ${billTitle} (${fileNumber}): What you need to know about upcoming municipal policy changes in ${category}. Grounded in official clerk records.`,
        threads: `What just passed at City Hall? ${billTitle} (${fileNumber}) will impact ${whoItAffects}. Here's the plain-language breakdown without the legal jargon ⬇️`,
        linkedin: `Municipal Policy Dispatch: The City Council is considering ${billTitle} (${fileNumber}). Key takeaways:\n• Scope: ${summary}\n• Demographic & Economic Impact: ${whoItAffects}\n• Fiscal Note: ${fiscalAmount > 0 ? `$${(fiscalAmount / 1000000).toFixed(1)}M` : 'Regulatory / Non-general fund'}\n\nTransparent civic data grounded in Open Civic Data (OCD-ID) standards.`,
        instagramSlides: [
          `🏛️ What Just Happened at City Hall?\n${billTitle} (${fileNumber})`,
          `📋 What it does:\n${summary}`,
          `👥 Who is impacted:\n${whoItAffects}`,
          `💰 Fiscal & Receipt Note:\n${fiscalAmount > 0 ? `$${(fiscalAmount / 1000000).toFixed(1)}M authorized` : 'Policy ordinance'} • Verified via Legistar Primary Records.`,
        ],
        hashtags: ['#LocalGov', '#CityCouncil', '#CivicTransparency', '#OpenGov', '#CivicDigest'],
      });
    }

    const prompt = `You are the CivicDigest Social News Editor. Convert this municipal government docket into compelling, non-partisan, high-signal social media posts across various platforms:

BILL TITLE: ${billTitle}
FILE NUMBER: ${fileNumber}
SUMMARY: ${summary}
WHO IT AFFECTS: ${whoItAffects}
FISCAL AMOUNT: ${fiscalAmount}
CATEGORY: ${category}
RECEIPT URL: ${receiptUrl || 'https://civicdigest.org'}

Generate:
1. "twitter": A concise, engaging post under 270 characters with emoji & relevant hashtags.
2. "bluesky": A clean, high-signal post under 290 characters citing the file number and official receipt.
3. "threads": A conversational community post highlighting why residents should care.
4. "linkedin": A professional summary emphasizing public policy, civic infrastructure, and fiscal stewardship.
5. "instagramSlides": An array of 4 short slide scripts (Slide 1: Headline hook, Slide 2: Plain explanation, Slide 3: Affected communities, Slide 4: Accountability & receipt cite).
6. "hashtags": Array of 4-5 relevant civic hashtags.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            twitter: { type: Type.STRING, description: 'Post under 275 chars' },
            bluesky: { type: Type.STRING, description: 'Post under 295 chars' },
            threads: { type: Type.STRING, description: 'Conversational community post' },
            linkedin: { type: Type.STRING, description: 'Professional breakdown' },
            instagramSlides: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 carousel slide scripts',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Relevant hashtags',
            },
          },
          required: ['twitter', 'bluesky', 'threads', 'linkedin', 'instagramSlides', 'hashtags'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/social-dispatch:', error);
    return NextResponse.json({ error: 'Failed to generate social media dispatch', details: String(error) }, { status: 500 });
  }
}
