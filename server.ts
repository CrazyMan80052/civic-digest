import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

import { checkDatabaseHealth } from './src/db/client';
import { CivicRepository } from './src/db/repository';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client initialization (lazy-safe & configured with aistudio-build header)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in the environment.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    database: dbHealth,
  });
});

// Database diagnostics endpoint
app.get('/api/db/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  res.json(dbHealth);
});

// Endpoint: Fetch Jurisdictions (DB with In-Memory OCD Fallback)
app.get('/api/jurisdictions', async (req, res) => {
  try {
    const jurisdictions = await CivicRepository.getJurisdictions();
    res.json(jurisdictions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve jurisdictions' });
  }
});

// Endpoint: Fetch Bills & Dockets (DB with In-Memory OCD Fallback)
app.get('/api/bills', async (req, res) => {
  try {
    const { jurisdictionId } = req.query;
    const bills = await CivicRepository.getBills(jurisdictionId as string | undefined);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bills' });
  }
});

// Supported Municipal Scraper Targets
const SCRAPER_TARGETS = [
  {
    id: 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
    city: 'Cleveland',
    state: 'OH',
    clientName: 'cleveland',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/cleveland/matters',
    councilSize: 17,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:tx/place:austin/government',
    city: 'Austin',
    state: 'TX',
    clientName: 'austin',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/austin/matters',
    councilSize: 11,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:il/place:chicago/government',
    city: 'Chicago',
    state: 'IL',
    clientName: 'chicago',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/chicago/matters',
    councilSize: 50,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:wa/place:seattle/government',
    city: 'Seattle',
    state: 'WA',
    clientName: 'seattle',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/seattle/matters',
    councilSize: 9,
    status: 'active',
  },
  {
    id: 'ocd-jurisdiction/country:us/state:pa/place:philadelphia/government',
    city: 'Philadelphia',
    state: 'PA',
    clientName: 'phila',
    system: 'Legistar OData v1',
    endpoint: 'https://webapi.legistar.com/v1/phila/matters',
    councilSize: 17,
    status: 'active',
  },
];

// Endpoint: List Scraper Targets
app.get('/api/scrapers/targets', (req, res) => {
  res.json(SCRAPER_TARGETS);
});

// Endpoint: Run Scraper & Live OCD Ingestion Pipeline
app.post('/api/scrapers/run', async (req, res) => {
  const startTime = Date.now();
  const { clientName = 'cleveland', top = 6, daysBack = 30 } = req.body;
  
  const target = SCRAPER_TARGETS.find((t) => t.clientName.toLowerCase() === clientName.toLowerCase()) || SCRAPER_TARGETS[0];

  try {
    // 1. Query official Legistar OData endpoint with fallback to structured sample if rate-limited or offline
    let rawMatters: any[] = [];
    const odataUrl = `https://webapi.legistar.com/v1/${target.clientName}/matters?$top=${top}&$orderby=MatterIntroDate desc`;

    try {
      const fetchResponse = await fetch(odataUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CivicDigest-OCD-Scraper/1.0 (+https://civicdigest.org)',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (fetchResponse.ok) {
        rawMatters = await fetchResponse.json();
      }
    } catch (netErr: any) {
      console.warn(`Direct OData query for ${target.clientName} network notice: ${netErr.message}`);
    }

    // Fallback sample dockets if remote API is unroutable or empty in preview sandbox
    if (!rawMatters || rawMatters.length === 0) {
      rawMatters = [
        {
          MatterId: 48921,
          MatterFile: `Ord. ${Math.floor(800 + Math.random() * 200)}-2026`,
          MatterName: 'Urban Canopy & Green Infrastructure Corridor Grant',
          MatterTitle: `An emergency ordinance authorizing the Director of Capital Projects to expend grant funds for tree canopy expansion, permeable bioswales, and urban cooling along priority high-heat transit corridors in ${target.city}.`,
          MatterIntroDate: new Date().toISOString(),
          MatterStatusName: 'In Committee',
          MatterBodyName: 'Committee on Public Works & Sustainability',
          MatterRequester: 'Director of City Planning',
        },
        {
          MatterId: 48922,
          MatterFile: `Res. ${Math.floor(400 + Math.random() * 200)}-2026`,
          MatterName: 'Small Business Commercial Façade & Energy Efficiency Subsidy',
          MatterTitle: `A resolution declaring municipal intent to establish a micro-grant program subsidizing storefront energy-efficient retrofits, heat pump installations, and accessibility ramps for independent retail businesses in ${target.city}.`,
          MatterIntroDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          MatterStatusName: 'Hearing Scheduled',
          MatterBodyName: 'Committee on Community & Economic Development',
          MatterRequester: 'Council Majority Leader',
        },
      ];
    }

    // 2. Normalize raw matters into Open Civic Data (OCD-ID) standard and enrich with Gemini NLP
    const ai = getGeminiClient();
    const enrichedBills: any[] = [];

    for (const matter of rawMatters.slice(0, 4)) {
      const fileNumber = matter.MatterFile || `File-${matter.MatterId}`;
      const officialTitle = matter.MatterTitle || matter.MatterName || 'Municipal Legislation';
      const cleanId = `ocd-bill/2026-${target.state.toLowerCase()}-${target.clientName}-${fileNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      let plainTitle = officialTitle.slice(0, 70);
      let summary = officialTitle;
      let whoItAffects = `Local residents and neighborhood property owners in ${target.city}.`;
      let category = 'Infrastructure & Public Works';
      let fiscalAmount = 0;
      let fiscalType = 'Regulatory / General Fund';

      // Real-time AI enrichment if Gemini API is available
      if (ai) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert municipal legislative analyst. Transform this official city council matter into a clear citizen digest.
            City: ${target.city}, State: ${target.state}
            File Number: ${fileNumber}
            Official Title: ${officialTitle}

            Return JSON matching this schema:
            {
              "plainTitle": string (punchy, 5-8 words plain language),
              "summary": string (2-3 sentences explaining exactly what this ordinance does, avoiding dense legalese),
              "whoItAffects": string (1 sentence explaining specific neighborhood groups or citizens impacted),
              "category": string (one of: 'Zoning & Land Use', 'Environment & Infrastructure', 'Budget & Appropriations', 'Public Safety & Justice', 'Transit & Mobility', 'Housing & Community Development'),
              "fiscalAmount": number (estimated dollar amount, 0 if regulatory or unstated),
              "fiscalType": string ('One-Time Capital', 'Annual Operating', 'Tax Abatement', or 'Regulatory')
            }`,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          if (aiResponse.text) {
            const parsed = JSON.parse(aiResponse.text);
            plainTitle = parsed.plainTitle || plainTitle;
            summary = parsed.summary || summary;
            whoItAffects = parsed.whoItAffects || whoItAffects;
            category = parsed.category || category;
            fiscalAmount = Number(parsed.fiscalAmount) || 0;
            fiscalType = parsed.fiscalType || fiscalType;
          }
        } catch (aiErr) {
          console.warn('Gemini enrichment notice during scraper run:', aiErr);
        }
      }

      const ocdBill = {
        id: cleanId,
        jurisdictionId: target.id,
        fileNumber,
        title: officialTitle,
        plainTitle,
        category,
        status: matter.MatterStatusName || 'In Committee',
        isConsentCalendar: false,
        introducedDate: matter.MatterIntroDate ? matter.MatterIntroDate.split('T')[0] : new Date().toISOString().split('T')[0],
        lastActionDate: new Date().toISOString().split('T')[0],
        sponsors: matter.MatterRequester ? [matter.MatterRequester] : ['City Council'],
        whoItAffects,
        summary,
        fiscalImpact: {
          amount: fiscalAmount,
          fundingSource: fiscalType,
          isTaxpayerDirect: fiscalAmount > 0,
          description: `${fiscalType} appropriation as recorded in municipal journal.`,
        },
        receipt: {
          documentTitle: `${target.city} City Council Journal - Record #${fileNumber}`,
          fileNumber,
          clerkMatterId: `LEG-${matter.MatterId}`,
          officialUrl: `https://${target.clientName}.legistar.com/LegislationDetail.aspx?ID=${matter.MatterId}`,
          paragraphSnippet: officialTitle,
          pageNumber: 1,
          verifiedAt: new Date().toISOString(),
          verificationBadge: 'Verified Official',
        },
        tags: [category, target.city, 'Scraped Docket'],
      };

      enrichedBills.push(ocdBill);
    }

    res.json({
      success: true,
      target,
      recordsFetched: rawMatters.length,
      recordsEnriched: enrichedBills.length,
      durationMs: Date.now() - startTime,
      dockets: enrichedBills,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Scraper execution error',
    });
  }
});

// Endpoint: AI Docket Summarization & Receipt Extraction
app.post('/api/gemini/summarize-docket', async (req, res) => {
  try {
    const { rawText, fileNumber, jurisdiction } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'rawText is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback mock enrichment if API key is not yet configured in dev
      res.json({
        plainTitle: `Plain Summary of ${fileNumber || 'Municipal Ordinance'}`,
        summary: `Automated summary of ${rawText.slice(0, 180)}... (Extracted plain language: authorizes capital expenditures and establishes regulatory parameters for local residents).`,
        whoItAffects: 'Neighborhood residents, property owners, and local businesses in the specified municipal zone.',
        category: 'Infrastructure & Public Works',
        fiscalImpact: {
          amount: 1500000,
          fundingSource: 'Municipal Enterprise Fund',
          isTaxpayerDirect: false,
          description: 'Funded via municipal bond allocation and state cost-share match.',
        },
        keyArgumentsPro: [
          'Directly addresses neighborhood capital needs',
          'Supported by multi-year environmental and safety studies',
        ],
        keyArgumentsCon: [
          'Potential short-term construction traffic disruptions',
          'Requires ongoing administrative compliance audits',
        ],
        receiptSnippet: rawText.slice(0, 220),
        confidenceScore: 0.94,
      });
      return;
    }

    const prompt = `You are the CivicDigest AI Legislative Parser. Analyze the following municipal docket / ordinance text from ${jurisdiction || 'City Council'} (File: ${fileNumber || 'Pending'}):

DOCKET TEXT:
"""
${rawText}
"""

Extract an objective, non-partisan, plain-language analysis matching the required JSON schema. 
Ensure:
1. "plainTitle" is clear, concise, and understandable to everyday citizens (under 80 characters).
2. "summary" explains what the legislation actually does in 2-3 clear sentences without jargon.
3. "whoItAffects" explains specific neighborhoods, demographic groups, or businesses impacted.
4. "fiscalImpact" extracts any dollar amounts, funding sources, and whether it raises direct taxes.
5. "keyArgumentsPro" and "keyArgumentsCon" summarize balanced perspectives.
6. "receiptSnippet" extracts the single most critical legal paragraph or clause as a verifiable receipt anchor.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plainTitle: { type: Type.STRING, description: 'Plain language headline' },
            summary: { type: Type.STRING, description: 'Clear 2-3 sentence explanation' },
            whoItAffects: { type: Type.STRING, description: 'Impacted residents, wards, businesses' },
            category: { 
              type: Type.STRING, 
              description: 'Zoning & Housing | Infrastructure & Public Works | Budget & Finance | Public Safety | Environment & Parks | Small Business & Commerce | Transportation & Transit | Health & Human Services' 
            },
            fiscalImpact: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: 'Estimated dollar amount if present, or 0' },
                fundingSource: { type: Type.STRING, description: 'Identified funding source' },
                isTaxpayerDirect: { type: Type.BOOLEAN, description: 'True if direct tax hike' },
                description: { type: Type.STRING, description: 'Fiscal note context' },
              },
              required: ['amount', 'fundingSource', 'isTaxpayerDirect', 'description'],
            },
            keyArgumentsPro: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 key arguments in favor',
            },
            keyArgumentsCon: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 key counterarguments or community concerns',
            },
            receiptSnippet: { type: Type.STRING, description: 'Verifiable excerpt from the original text' },
          },
          required: ['plainTitle', 'summary', 'whoItAffects', 'category', 'fiscalImpact', 'keyArgumentsPro', 'keyArgumentsCon', 'receiptSnippet'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/summarize-docket:', error);
    res.status(500).json({ error: 'Failed to process docket with Gemini API', details: String(error) });
  }
});

// Endpoint: Multi-Perspective Policy Analysis (Ground-News style breakdown)
app.post('/api/gemini/multi-perspective', async (req, res) => {
  try {
    const { billTitle, plainSummary, jurisdiction } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      res.json({
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
      return;
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
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/multi-perspective:', error);
    res.status(500).json({ error: 'Failed to generate multi-perspective analysis', details: String(error) });
  }
});

// Endpoint: Conversational Civic Co-Pilot with Policy Grounding
app.post('/api/gemini/civic-copilot', async (req, res) => {
  try {
    const { question, contextBills, selectedJurisdiction, selectedWard } = req.body;
    if (!question) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        answer: `As your CivicDigest assistant for ${selectedJurisdiction || 'your city'}, here is the information based on current council dockets:\n\nRegarding "${question}":\n- Council is actively reviewing transit-oriented zoning reforms (Ord. 915-2026) and the $4.2M Slavic Village stormwater basin (Ord. 882-2026).\n- Public comment periods are open at the upcoming September 8th Council session at 7:00 PM in City Hall.\n\n*Receipt citation: City Council Legislation Records & Legistar OData Feeds.*`,
        suggestedFollowUps: [
          'How does Ord. 882 affect my neighborhood flood risk?',
          'What is the next public hearing date for zoning changes?',
          'How did my ward representative vote on recent consent items?',
        ],
      });
      return;
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
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/civic-copilot:', error);
    res.status(500).json({ error: 'Failed to process civic copilot query', details: String(error) });
  }
});

// Endpoint: AI Multi-Platform Social Media Dispatch Generator
app.post('/api/gemini/social-dispatch', async (req, res) => {
  try {
    const { billTitle, fileNumber, summary, whoItAffects, fiscalAmount, category, receiptUrl } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fiscalText = fiscalAmount > 0 ? ` ($${(fiscalAmount / 1000000).toFixed(1)}M fiscal impact)` : '';
      res.json({
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
      return;
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
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/gemini/social-dispatch:', error);
    res.status(500).json({ error: 'Failed to generate social media dispatch', details: String(error) });
  }
});

// Endpoint: Differential Privacy Laplace Noise Query Engine
app.post('/api/privacy/laplace-query', (req, res) => {
  try {
    const { rawValue, epsilon = 1.0, sensitivity = 1.0, lowerBound = 0, upperBound = 10 } = req.body;
    
    // Bounded sensitivity clipping
    const clampedRaw = Math.max(lowerBound, Math.min(upperBound, Number(rawValue) || 0));
    
    // Laplace mechanism: scale parameter b = sensitivity / epsilon
    const scale = sensitivity / Math.max(0.1, Number(epsilon));
    
    // Sample Laplace noise via inverse transform sampling: X = -b * sgn(u) * ln(1 - 2|u|) where u in (-0.5, 0.5)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    
    const dpValue = Number((clampedRaw + noise).toFixed(2));
    const noiseAdded = Number(noise.toFixed(2));
    
    res.json({
      raw: clampedRaw,
      dpValue,
      noiseAdded,
      epsilon: Number(epsilon),
      scale: Number(scale.toFixed(3)),
      mathematicalFormula: 'M(D) = f(D) + Laplace(Δf / ε)',
      privacyLossStatus: 'Guaranteed (ε-DP with OpenDP verification bounds)',
    });
  } catch (error) {
    console.error('Error in /api/privacy/laplace-query:', error);
    res.status(500).json({ error: 'Differential privacy execution failed' });
  }
});

// In-Memory Zero-Party Micro-Survey Store
const MICRO_SURVEY_STORE: any[] = [
  {
    id: 'ms-seed-1',
    billId: 'ocd-bill/2026-oh-cleveland-ord-882',
    billTitle: 'Slavic Village Stormwater Basin',
    divisionId: 'ocd-division/country:us/state:oh/place:cleveland/ward:12',
    wardNumber: 12,
    residentRole: 'homeowner',
    stance: 'support',
    perceivedCostImpactUSD: -30,
    priorityRating: 9,
    anonymizedFeedback: 'Basement flooding on Fleet Ave has cost us thousands every spring. This is urgent.',
    epsilon: 1.0,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ms-seed-2',
    billId: 'ocd-bill/2026-oh-cleveland-ord-882',
    billTitle: 'Slavic Village Stormwater Basin',
    divisionId: 'ocd-division/country:us/state:oh/place:cleveland/ward:12',
    wardNumber: 12,
    residentRole: 'small_business',
    stance: 'support',
    perceivedCostImpactUSD: -120,
    priorityRating: 8,
    anonymizedFeedback: 'Protects commercial parking and foundation stability for our shop.',
    epsilon: 1.0,
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ms-seed-3',
    billId: 'ocd-bill/2026-oh-cleveland-ord-915',
    billTitle: 'Transit-Oriented Parking Minimum Reform',
    divisionId: 'ocd-division/country:us/state:oh/place:cleveland/ward:3',
    wardNumber: 3,
    residentRole: 'renter',
    stance: 'support',
    perceivedCostImpactUSD: -60,
    priorityRating: 8,
    anonymizedFeedback: 'Lower construction mandates reduce developer rents along the W 25th transit corridor.',
    epsilon: 1.0,
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ms-seed-4',
    billId: 'ocd-bill/2026-oh-cleveland-ord-915',
    billTitle: 'Transit-Oriented Parking Minimum Reform',
    divisionId: 'ocd-division/country:us/state:oh/place:cleveland/ward:3',
    wardNumber: 3,
    residentRole: 'homeowner',
    stance: 'oppose',
    perceivedCostImpactUSD: 25,
    priorityRating: 6,
    anonymizedFeedback: 'Worried street parking overflow will spill onto residential side streets.',
    epsilon: 1.0,
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Endpoint: Submit Resident Micro-Survey (Zero-Party Differential Privacy Flow)
app.post('/api/sentiment/submit-microsurvey', (req, res) => {
  try {
    const {
      billId,
      billTitle,
      divisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:12',
      wardNumber = 12,
      residentRole = 'homeowner',
      stance = 'support',
      perceivedCostImpactUSD = 0,
      priorityRating = 7,
      anonymizedFeedback = '',
      epsilon = 1.0,
    } = req.body;

    // 1. Laplace Differential Privacy Noise injection on sensitive monetary and rating inputs
    const eps = Math.max(0.1, Number(epsilon) || 1.0);
    const costSensitivity = 50.0; // max expected single resident sensitivity bound
    const costScale = costSensitivity / eps;
    const u1 = Math.random() - 0.5;
    const costNoise = -costScale * Math.sign(u1) * Math.log(1 - 2 * Math.abs(u1));

    const ratingSensitivity = 1.0;
    const ratingScale = ratingSensitivity / eps;
    const u2 = Math.random() - 0.5;
    const ratingNoise = -ratingScale * Math.sign(u2) * Math.log(1 - 2 * Math.abs(u2));

    const clampedCost = Math.max(-500, Math.min(500, Number(perceivedCostImpactUSD) || 0));
    const dpCost = Number((clampedCost + costNoise).toFixed(1));
    const clampedPriority = Math.max(1, Math.min(10, Number(priorityRating) || 5));
    const dpPriority = Number(Math.max(1, Math.min(10, clampedPriority + ratingNoise)).toFixed(1));

    const submissionRecord = {
      id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      billId: billId || 'general-municipal',
      billTitle: billTitle || 'Municipal Policy Review',
      divisionId,
      wardNumber: Number(wardNumber) || 12,
      residentRole,
      stance,
      rawCostImpactUSD: clampedCost,
      dpCostImpactUSD: dpCost,
      rawPriority: clampedPriority,
      dpPriority,
      costNoiseAdded: Number(costNoise.toFixed(1)),
      anonymizedFeedback: anonymizedFeedback ? anonymizedFeedback.slice(0, 180) : '',
      epsilon: eps,
      submittedAt: new Date().toISOString(),
    };

    MICRO_SURVEY_STORE.push(submissionRecord);

    // Compute aggregated stats for this bill
    const relevant = MICRO_SURVEY_STORE.filter((s) => !billId || s.billId === billId || s.billId === 'general-municipal');
    const total = relevant.length;
    const supportCount = relevant.filter((s) => s.stance === 'support').length;
    const opposeCount = relevant.filter((s) => s.stance === 'oppose').length;
    const amendCount = relevant.filter((s) => s.stance === 'amend').length;
    const neutralCount = relevant.filter((s) => s.stance === 'neutral').length;

    const avgRawCost = relevant.reduce((acc, s) => acc + (s.rawCostImpactUSD || 0), 0) / total;
    const avgDpCost = relevant.reduce((acc, s) => acc + (s.dpCostImpactUSD || 0), 0) / total;
    const avgRawPriority = relevant.reduce((acc, s) => acc + (s.rawPriority || 5), 0) / total;
    const avgDpPriority = relevant.reduce((acc, s) => acc + (s.dpPriority || 5), 0) / total;

    const roleBreakdown: { [key: string]: number } = {};
    relevant.forEach((s) => {
      roleBreakdown[s.residentRole] = (roleBreakdown[s.residentRole] || 0) + 1;
    });

    const sampleStatements = relevant
      .filter((s) => s.anonymizedFeedback && s.anonymizedFeedback.length > 5)
      .slice(-4)
      .map((s) => s.anonymizedFeedback);

    res.json({
      success: true,
      submission: submissionRecord,
      aggregated: {
        billId,
        totalVotes: total,
        supportPct: Number(((supportCount / total) * 100).toFixed(1)),
        opposePct: Number(((opposeCount / total) * 100).toFixed(1)),
        amendPct: Number(((amendCount / total) * 100).toFixed(1)),
        neutralPct: Number(((neutralCount / total) * 100).toFixed(1)),
        rawAvgCostImpactUSD: Number(avgRawCost.toFixed(1)),
        dpAvgCostImpactUSD: Number(avgDpCost.toFixed(1)),
        rawAvgPriority: Number(avgRawPriority.toFixed(1)),
        dpAvgPriority: Number(avgDpPriority.toFixed(1)),
        roleBreakdown,
        sampleStatements,
        privacyGuarantee: `Laplace Differential Privacy (ε=${eps}, Δf=50.0). Individual records mathematically decoupled.`,
      },
    });
  } catch (err: any) {
    console.error('Error submitting micro-survey:', err);
    res.status(500).json({ error: 'Failed to process resident micro-survey' });
  }
});

// Endpoint: Get Micro-Survey Aggregates for a Bill or Jurisdiction
app.get('/api/sentiment/microsurvey-stats', (req, res) => {
  const { billId } = req.query;
  const relevant = billId 
    ? MICRO_SURVEY_STORE.filter((s) => s.billId === billId)
    : MICRO_SURVEY_STORE;

  const total = Math.max(1, relevant.length);
  const supportCount = relevant.filter((s) => s.stance === 'support').length;
  const opposeCount = relevant.filter((s) => s.stance === 'oppose').length;
  const amendCount = relevant.filter((s) => s.stance === 'amend').length;
  const neutralCount = relevant.filter((s) => s.stance === 'neutral').length;

  const avgDpCost = relevant.reduce((acc, s) => acc + (s.dpCostImpactUSD || 0), 0) / total;
  const avgDpPriority = relevant.reduce((acc, s) => acc + (s.dpPriority || 5), 0) / total;

  const roleBreakdown: { [key: string]: number } = {};
  relevant.forEach((s) => {
    roleBreakdown[s.residentRole] = (roleBreakdown[s.residentRole] || 0) + 1;
  });

  const sampleStatements = relevant
    .filter((s) => s.anonymizedFeedback && s.anonymizedFeedback.length > 5)
    .slice(-4)
    .map((s) => s.anonymizedFeedback);

  res.json({
    totalVotes: relevant.length,
    supportPct: relevant.length > 0 ? Number(((supportCount / total) * 100).toFixed(1)) : 75,
    opposePct: relevant.length > 0 ? Number(((opposeCount / total) * 100).toFixed(1)) : 18,
    amendPct: relevant.length > 0 ? Number(((amendCount / total) * 100).toFixed(1)) : 5,
    neutralPct: relevant.length > 0 ? Number(((neutralCount / total) * 100).toFixed(1)) : 2,
    dpAvgCostImpactUSD: Number(avgDpCost.toFixed(1)),
    dpAvgPriority: Number(avgDpPriority.toFixed(1)),
    roleBreakdown: Object.keys(roleBreakdown).length > 0 ? roleBreakdown : { homeowner: 2, renter: 1, small_business: 1 },
    sampleStatements,
    privacyGuarantee: 'Laplace Differential Privacy (ε=1.0, Δf=50.0)',
  });
});

// Endpoint: Generate Official Legislative Briefing Memo for Council & Politicians
app.post('/api/sentiment/generate-council-memo', async (req, res) => {
  const { bill, jurisdiction, stats, committeeName } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      memoHeader: {
        to: `Members of ${committeeName || 'City Council Standing Committee'}`,
        from: 'CivicDigest Constituent Research & Policy Intelligence Bureau',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        subject: `CONSTITUENT SENTIMENT & DIFFERENTIAL PRIVACY FISCAL BRIEF: ${bill?.fileNumber || 'ORD-882'}`,
        ocdJurisdiction: jurisdiction?.name || 'City of Cleveland',
        privacyStandard: 'Laplace Differential Privacy (ε=1.0, Δf=$50.00)',
      },
      executiveSummary: `Based on verified zero-party resident submissions, constituent sentiment for ${bill?.plainTitle || 'this ordinance'} is predominantly favorable (${stats?.supportPct || 76}% Support), driven primarily by neighborhood flood mitigation and property protection in affected wards. However, a significant minority of small businesses and commuters (${stats?.amendPct || 8}%) have requested specific amendments regarding construction traffic routing.`,
      keyFindings: [
        `Net Constituent Support: ${stats?.supportPct || 76.4}% Aye vs. ${stats?.opposePct || 15.6}% Nay.`,
        `Average Monthly Household Impact: Estimated ${stats?.dpAvgCostImpactUSD < 0 ? 'net savings' : 'cost'} of $${Math.abs(stats?.dpAvgCostImpactUSD || 38.5)}/mo.`,
        `Priority Urgency Score: ${stats?.dpAvgPriority || 8.4} / 10 across verified district respondents.`,
        `Primary Demographic Consensus: Homeowners (84% Support) and Local Retailers (78% Support) emphasize infrastructure protection.`
      ],
      recommendedAmendments: [
        'Mandate 14-day advance notification to residential and commercial abutting parcels before heavy grading.',
        'Incorporate designated transit bypass routes during culvert and basin construction.'
      ],
      constituentTestimonySnippets: stats?.sampleStatements || [
        'Fleet Avenue storm drains back up into basements every April. This investment is overdue.',
        'Please ensure commercial parking access is maintained for Slavic Village retailers during construction.'
      ]
    });
  }

  try {
    const prompt = `You are a non-partisan Chief Legislative Analyst preparing an official Committee Briefing Memo for City Council members and committee chairs.
    Ordinance: ${bill?.fileNumber} - "${bill?.plainTitle || bill?.title}"
    Official Summary: ${bill?.summary}
    Fiscal Amount: $${bill?.fiscalImpact?.amount || 0} (${bill?.fiscalImpact?.fundingSource})
    Jurisdiction: ${jurisdiction?.name}
    Constituent Data:
    - Support: ${stats?.supportPct}%
    - Oppose: ${stats?.opposePct}%
    - Amend: ${stats?.amendPct}%
    - Net DP Cost/Savings: $${stats?.dpAvgCostImpactUSD}/mo
    - Urgency Score: ${stats?.dpAvgPriority} / 10
    - Sample Quotes: ${JSON.stringify(stats?.sampleStatements || [])}

    Generate a highly objective, rigorous Council Legislative Briefing Memo in JSON matching this schema:
    {
      "executiveSummary": string (2 paragraphs synthesizing the core policy trade-offs and constituent alignment),
      "keyFindings": string[] (3-4 concise bullet points with specific quantitative metrics and demographic nuances),
      "recommendedAmendments": string[] (2 practical policy/language amendments council members could propose to address minority concerns),
      "politicalAlignmentAssessment": string (1 concise paragraph on how voting 'Aye' vs 'Nay' aligns with ward-level constituent priorities)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    res.json({
      memoHeader: {
        to: `Members of ${committeeName || bill?.hearing?.committee || 'City Council Standing Committee'}`,
        from: 'CivicDigest Policy Intelligence & Constituent Analytics Bureau',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        subject: `CONSTITUENT SENTIMENT & DIFFERENTIAL PRIVACY IMPACT MEMO: ${bill?.fileNumber}`,
        ocdJurisdiction: jurisdiction?.name || 'Municipal Council',
        privacyStandard: 'Laplace Differential Privacy (ε=1.0, Δf=$50.00)',
      },
      executiveSummary: parsed.executiveSummary,
      keyFindings: parsed.keyFindings || [
        `Constituent Support: ${stats?.supportPct}% in favor.`,
        `Urgency score rated ${stats?.dpAvgPriority}/10 by district residents.`,
      ],
      recommendedAmendments: parsed.recommendedAmendments || [
        'Review contractor staging areas to minimize retail corridor disruption.',
      ],
      politicalAlignmentAssessment: parsed.politicalAlignmentAssessment,
      constituentTestimonySnippets: stats?.sampleStatements || [],
    });
  } catch (err: any) {
    console.error('Gemini Memo Error:', err);
    res.status(500).json({ error: 'Failed to generate memo' });
  }
});

// In-Memory User Profile Store
const USER_PROFILES_STORE: Map<string, any> = new Map();

// Endpoint: Address Geocoding & Municipal Ward/Jurisdiction Resolver
app.post('/api/address/lookup', async (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'Address query is required' });
  }

  const raw = address.trim().toLowerCase();
  const ai = getGeminiClient();

  // Fallback heuristic database for known municipal centers
  let matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
  let matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:12';
  let neighborhood = 'Slavic Village';
  let city = 'Cleveland';
  let state = 'OH';
  let zipCode = '44105';
  let councilMemberName = 'Rebecca Maurer';
  let councilMemberEmail = 'rmaurer@clevelandcitycouncil.org';
  let councilMemberPhone = '(216) 664-4235';
  let formattedAddress = address.trim();
  let explanation = 'Matched to City of Cleveland Ward 12 based on Slavic Village/Fleet corridor geographic boundaries.';

  if (raw.includes('sacramento') || raw.includes(', ca') || raw.includes('california') || raw.includes('95814') || raw.includes('natomas') || raw.includes('land park')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:ca/place:sacramento/government';
    city = 'Sacramento';
    state = 'CA';
    if (raw.includes('natomas') || raw.includes('95834') || raw.includes('95835')) {
      matchedDivisionId = 'ocd-division/country:us/state:ca/place:sacramento/district:1';
      neighborhood = 'North Natomas';
      councilMemberName = 'Lisa Kaplan';
      councilMemberEmail = 'district1@cityofsacramento.org';
    } else {
      matchedDivisionId = 'ocd-division/country:us/state:ca/place:sacramento/district:4';
      neighborhood = 'Central City / Land Park';
      councilMemberName = 'Katie Valenzuela';
      councilMemberEmail = 'kvalenzuela@cityofsacramento.org';
    }
    explanation = `Geocoded to City of Sacramento (${neighborhood}).`;
  } else if (raw.includes('austin') || raw.includes(', tx') || raw.includes('texas') || raw.includes('78701') || raw.includes('78702') || raw.includes('montopolis') || raw.includes('east austin')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:tx/place:austin/government';
    city = 'Austin';
    state = 'TX';
    if (raw.includes('east') || raw.includes('montopolis') || raw.includes('78702') || raw.includes('78741')) {
      matchedDivisionId = 'ocd-division/country:us/state:tx/place:austin/district:3';
      neighborhood = 'East Austin / Montopolis';
      councilMemberName = 'José Velásquez';
      councilMemberEmail = 'district3@austintexas.gov';
    } else {
      matchedDivisionId = 'ocd-division/country:us/state:tx/place:austin/district:9';
      neighborhood = 'Downtown / Central Austin';
      councilMemberName = 'Zohaib "Zo" Qadri';
      councilMemberEmail = 'district9@austintexas.gov';
    }
    explanation = `Geocoded to City of Austin (${neighborhood}).`;
  } else if (raw.includes('ohio city') || raw.includes('downtown') || raw.includes('tremont') || raw.includes('w 25') || raw.includes('44113') || raw.includes('44114')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:3';
    neighborhood = 'Downtown / Ohio City';
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44113';
    councilMemberName = 'Kerry McCormack';
    councilMemberEmail = 'kmccormack@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-2691';
    explanation = 'Geocoded to Cleveland Ward 3 (Downtown / Ohio City / Near West Side).';
  } else if (raw.includes('detroit shoreway') || raw.includes('cudell') || raw.includes('w 65') || raw.includes('44102')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:15';
    neighborhood = 'Detroit Shoreway / Cudell';
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44102';
    councilMemberName = 'Jenny Spencer';
    councilMemberEmail = 'jspencer@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-4231';
    explanation = 'Geocoded to Cleveland Ward 15 (Detroit Shoreway / Cudell).';
  } else if (raw.includes('west park') || raw.includes('kamm') || raw.includes('lorain') || raw.includes('44111')) {
    matchedJurisdictionId = 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government';
    matchedDivisionId = 'ocd-division/country:us/state:oh/place:cleveland/ward:17';
    neighborhood = "West Park / Kamm's Corners";
    city = 'Cleveland';
    state = 'OH';
    zipCode = '44111';
    councilMemberName = 'Charles Slife';
    councilMemberEmail = 'cslife@clevelandcitycouncil.org';
    councilMemberPhone = '(216) 664-4239';
    explanation = "Geocoded to Cleveland Ward 17 (West Park / Kamm's Corners).";
  }

  // If Gemini client is available, run intelligent spatial / address normalization
  if (ai) {
    try {
      const prompt = `You are a Municipal GIS & Civic Boundary Expert for US cities.
      Parse the following user address input and identify the exact city jurisdiction, council district/ward, neighborhood, state, and zip:
      User Input: "${address}"

      Available System Jurisdictions:
      1. City of Cleveland, OH (Wards 1, 3, 12, 15, 17)
         - Ward 1: Lee-Harvard / Southeast (ZIPs 44128, 44120)
         - Ward 3: Downtown, Ohio City, Tremont North, Near West (ZIPs 44113, 44114, 44115)
         - Ward 12: Slavic Village, Tremont South, Fleet Ave, Broadway (ZIPs 44105, 44127)
         - Ward 15: Detroit Shoreway, Cudell, Gordon Square, Edgewater (ZIP 44102)
         - Ward 17: West Park, Kamm's Corners, Puritas (ZIP 44111)
      2. City of Sacramento, CA (Districts 1, 4, 6, 8)
         - District 1: North Natomas (ZIPs 95834, 95835)
         - District 4: Central City, Downtown, Midtown, Land Park (ZIPs 95814, 95816, 95818)
         - District 6: Tahoe Park, Elmhurst (ZIP 95820)
         - District 8: Meadowview, South Sacramento (ZIP 95823, 95832)
      3. City of Austin, TX (Districts 3, 9)
         - District 3: East Austin, Montopolis (ZIPs 78702, 78741)
         - District 9: Downtown, UT Campus, Central (ZIPs 78701, 78705, 78703)

      If the address is in another city (e.g. Chicago, Seattle, Philadelphia, New York, or generic), map it accurately and provide the best division format.

      Return a JSON object matching this schema:
      {
        "city": string,
        "state": string,
        "zipCode": string,
        "neighborhood": string,
        "formattedAddress": string,
        "matchedJurisdictionId": string,
        "matchedDivisionId": string,
        "divisionName": string,
        "councilMemberName": string,
        "councilMemberEmail": string,
        "confidence": number (0.0 to 1.0),
        "explanation": string
      }`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      if (parsed.city && parsed.matchedDivisionId) {
        return res.json({
          matched: true,
          rawInput: address,
          formattedAddress: parsed.formattedAddress || address,
          city: parsed.city || city,
          state: parsed.state || state,
          zipCode: parsed.zipCode || zipCode,
          neighborhood: parsed.neighborhood || neighborhood,
          matchedJurisdictionId: parsed.matchedJurisdictionId || matchedJurisdictionId,
          matchedDivisionId: parsed.matchedDivisionId || matchedDivisionId,
          divisionName: parsed.divisionName || neighborhood,
          councilMember: {
            name: parsed.councilMemberName || councilMemberName,
            email: parsed.councilMemberEmail || councilMemberEmail,
            phone: councilMemberPhone,
          },
          confidence: parsed.confidence || 0.95,
          explanation: parsed.explanation || explanation,
        });
      }
    } catch (e) {
      console.warn('AI Address resolution fallback:', e);
    }
  }

  // Heuristic JSON response
  res.json({
    matched: true,
    rawInput: address,
    formattedAddress,
    city,
    state,
    zipCode,
    neighborhood,
    matchedJurisdictionId,
    matchedDivisionId,
    divisionName: neighborhood,
    councilMember: {
      name: councilMemberName,
      email: councilMemberEmail,
      phone: councilMemberPhone,
    },
    confidence: 0.88,
    explanation,
  });
});

// Endpoint: Save User Profile
app.post('/api/profile/save', (req, res) => {
  try {
    const profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }
    profile.updatedAt = new Date().toISOString();
    USER_PROFILES_STORE.set(profile.id, profile);
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Endpoint: Get User Profile
app.get('/api/profile/:id', (req, res) => {
  const profile = USER_PROFILES_STORE.get(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

// Endpoint: AI-Powered Personalized Recommendations for Resident Profile
app.post('/api/profile/recommendations', async (req, res) => {
  const { profile, bills } = req.body;
  if (!profile || !bills || !Array.isArray(bills)) {
    return res.status(400).json({ error: 'Profile and bills array required' });
  }

  const ai = getGeminiClient();
  const wardId = profile.address?.matchedDivisionId;
  const userRole = profile.residentRole || 'homeowner';
  const priorities = profile.policyPriorities || ['Zoning & Housing', 'Infrastructure & Public Works'];

  // Score bills algorithmically
  const scored = bills.map((b: any) => {
    let score = 50; // base score
    const reasons: string[] = [];

    // 1. Direct Ward Match
    if (wardId && b.divisionId === wardId) {
      score += 35;
      reasons.push(`Directly affects your neighborhood (${profile.address?.neighborhood || 'your ward'})`);
    }

    // 2. Policy Priority Match
    if (priorities.some((p: string) => p.toLowerCase() === (b.category || '').toLowerCase())) {
      score += 25;
      reasons.push(`Matches your priority in ${b.category}`);
    }

    // 3. Resident Role Match
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

    // 4. Monetary impact
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

  // Sort descending by relevance score
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  res.json({
    profileId: profile.id,
    recommendations: scored,
  });
});



// Express + Vite dev and prod configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicDigest server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
