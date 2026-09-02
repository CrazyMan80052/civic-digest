import { NextResponse, NextRequest } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { billTitle, plainSummary, jurisdiction } = await req.json();
    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json({
        officialDocketStance: {
          sponsorIntent: 'Proposed to enhance neighborhood stability and align local zoning with regional transit goals.',
          legalDepartmentNote: 'Complies with municipal charter authority.',
          fiscalReviewNote: 'Encumbered funds approved in capital budget.',
        },
        mediaPerspectives: [
          {
            sourceName: 'The Local Gazette',
            sourceType: 'Daily Newspaper',
            biasRating: 'Center',
            headline: `Council Debates ${billTitle}: Focus on Public Costs vs. Long-term Benefits`,
            articleUrl: '#',
            summary: 'Examines economic tradeoffs and fiscal responsibility.',
            keyStance: 'Neutral reportage highlighting legislative process.',
            publishedDate: new Date().toISOString().split('T')[0],
          },
          {
            sourceName: 'Metro Community Voice',
            sourceType: 'Local Digital Journal',
            biasRating: 'Local Nonpartisan',
            headline: `Neighborhood Groups Rally Around Impact of ${billTitle}`,
            articleUrl: '#',
            summary: 'Details grassroots community testimony and resident priorities.',
            keyStance: 'Focused on neighborhood equity and access.',
            publishedDate: new Date().toISOString().split('T')[0],
          },
        ],
        publicCommentBreakdown: {
          totalComments: 45,
          supportPercentage: 72,
          opposePercentage: 20,
          neutralPercentage: 8,
          topResidentThemes: [
            { theme: 'Service Reliability', sentiment: 'pro', quoteSample: '"We need direct improvements in our ward."' },
            { theme: 'Cost Transparency', sentiment: 'con', quoteSample: '"Need guarantees on budget limits."' },
          ],
        },
        blindspotSummary: 'Mainstream press focused on budget approvals, while local resident forums focused on implementation timelines.',
      });
    }

    const prompt = `You are an expert non-partisan civic media analyst creating a Ground-News style multi-perspective breakdown of this local government policy:

Jurisdiction: ${jurisdiction || 'City Council'}
Title: ${billTitle}
Summary: ${plainSummary}

Generate a comprehensive 360-degree multi-perspective report:
1. Official Docket Stance: Sponsor intent, legal note, and fiscal review.
2. Media Perspectives: 3 distinct realistic local media articles (e.g. Daily Newspaper [Center], Local Digital Journal [Nonpartisan or Left], Business Journal [Business-focused]) with realistic headlines, summaries, and key stances.
3. Public Comment Breakdown: Non-partisan synthesis of resident feedback with support %, oppose %, neutral %, and representative quote samples.
4. Blindspot Summary: One sentence highlighting any topic covered in community forums that was missed in mainstream press.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            officialDocketStance: {
              type: Type.OBJECT,
              properties: {
                sponsorIntent: { type: Type.STRING },
                legalDepartmentNote: { type: Type.STRING },
                fiscalReviewNote: { type: Type.STRING },
              },
              required: ['sponsorIntent', 'legalDepartmentNote', 'fiscalReviewNote'],
            },
            mediaPerspectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceName: { type: Type.STRING },
                  sourceType: { type: Type.STRING },
                  biasRating: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  articleUrl: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyStance: { type: Type.STRING },
                  publishedDate: { type: Type.STRING },
                },
                required: ['sourceName', 'sourceType', 'biasRating', 'headline', 'summary', 'keyStance'],
              },
            },
            publicCommentBreakdown: {
              type: Type.OBJECT,
              properties: {
                totalComments: { type: Type.NUMBER },
                supportPercentage: { type: Type.NUMBER },
                opposePercentage: { type: Type.NUMBER },
                neutralPercentage: { type: Type.NUMBER },
                topResidentThemes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      theme: { type: Type.STRING },
                      sentiment: { type: Type.STRING },
                      quoteSample: { type: Type.STRING },
                    },
                    required: ['theme', 'sentiment', 'quoteSample'],
                  },
                },
              },
              required: ['totalComments', 'supportPercentage', 'opposePercentage', 'neutralPercentage', 'topResidentThemes'],
            },
            blindspotSummary: { type: Type.STRING },
          },
          required: ['officialDocketStance', 'mediaPerspectives', 'publicCommentBreakdown', 'blindspotSummary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/multi-perspective:', error);
    return NextResponse.json({ error: 'Failed to generate multi-perspective analysis', details: String(error) }, { status: 500 });
  }
}
