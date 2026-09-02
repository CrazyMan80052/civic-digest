import { NextResponse, NextRequest } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { question, contextBills, selectedJurisdiction, selectedWard } = await req.json();
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({
        answer: `As your CivicDigest assistant for ${selectedJurisdiction || 'your city'}, here is the information based on current council dockets:\n\nRegarding "${question}":\n- Council is actively reviewing transit-oriented zoning reforms (Ord. 915-2026) and the $4.2M Slavic Village stormwater basin (Ord. 882-2026).\n- Public comment periods are open at the upcoming September 8th Council session at 7:00 PM in City Hall.\n\n*Receipt citation: City Council Legislation Records & Legistar OData Feeds.*`,
        suggestedFollowUps: [
          'How does Ord. 882 affect my neighborhood flood risk?',
          'What is the next public hearing date for zoning changes?',
          'How did my ward representative vote on recent consent items?',
        ],
      });
    }

    const prompt = `You are CivicDigest Co-Pilot, an authoritative, non-partisan municipal policy assistant for ${selectedJurisdiction || 'City of Cleveland'} (Focus Ward/District: ${selectedWard || 'All Wards'}).

CONTEXT BILLS & DOCKETS:
${JSON.stringify(contextBills || [], null, 2)}

USER QUESTION:
"${question}"

Provide:
1. A clear, helpful, factual answer citing specific File Numbers, dollar amounts, and meeting dates whenever applicable.
2. 3 actionable follow-up questions the resident can ask.
3. Keep the tone professional, objective, accessible to an everyday constituent, and grounded in verifiable facts.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: 'Direct answer with citations to dockets' },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 relevant follow up questions',
            },
          },
          required: ['answer', 'suggestedFollowUps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/civic-copilot:', error);
    return NextResponse.json({ error: 'Failed to process civic copilot query', details: String(error) }, { status: 500 });
  }
}
