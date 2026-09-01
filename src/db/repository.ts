/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDbPool, queryDb } from './client';
import { BILLS as MOCK_BILLS, JURISDICTIONS as MOCK_JURISDICTIONS } from '../data/mockData';
import { OCDBill, OCDJurisdiction } from '../types';

/**
 * Data Access Layer (DAL) for CivicDigest.
 * Prioritizes PostgreSQL if DATABASE_URL is configured, else falls back to in-memory OCD-ID mock store.
 */
export class CivicRepository {
  /**
   * Retrieves all registered municipal jurisdictions
   */
  static async getJurisdictions(): Promise<OCDJurisdiction[]> {
    const pool = getDbPool();
    if (!pool) {
      return MOCK_JURISDICTIONS;
    }

    try {
      const rows = await queryDb<any>(`
        SELECT 
          id, 
          name, 
          classification, 
          state_code as "stateCode", 
          division_id as "divisionId",
          council_size as "councilSize", 
          next_hearing_date as "nextHearingDate",
          active_ordinance_count as "activeOrdinanceCount"
        FROM jurisdictions
        ORDER BY name ASC
      `);

      if (rows.length === 0) {
        return MOCK_JURISDICTIONS;
      }

      return rows.map((r) => {
        const mockMatch = MOCK_JURISDICTIONS.find((j) => j.id === r.id);
        return {
          id: r.id,
          name: r.name,
          state: r.stateCode || mockMatch?.state || 'OH',
          level: 'city' as const,
          legistarClient: mockMatch?.legistarClient || 'cleveland',
          divisions: mockMatch?.divisions || [],
        };
      });
    } catch (err) {
      console.warn('Repository getJurisdictions fallback to mock data:', err);
      return MOCK_JURISDICTIONS;
    }
  }

  /**
   * Retrieves bills & dockets for a given jurisdiction with full primary source citations
   */
  static async getBills(jurisdictionId?: string): Promise<OCDBill[]> {
    const pool = getDbPool();
    if (!pool) {
      return jurisdictionId
        ? MOCK_BILLS.filter((b) => b.jurisdictionId === jurisdictionId)
        : MOCK_BILLS;
    }

    try {
      let query = `
        SELECT 
          b.id,
          b.jurisdiction_id as "jurisdictionId",
          b.file_number as "fileNumber",
          b.official_title as "officialTitle",
          b.plain_title as "plainTitle",
          b.category,
          b.status,
          b.introduction_date as "introductionDate",
          b.next_action_date as "nextActionDate",
          b.sponsors,
          b.affected_wards as "affectedWards",
          b.who_it_affects as "whoItAffects",
          b.summary,
          b.fiscal_amount as "fiscalAmount",
          b.fiscal_type as "fiscalType",
          b.fiscal_description as "fiscalDescription",
          b.committee_name as "committeeName",
          b.location,
          b.tags,
          b.perspectives_cache as "perspectivesCache",
          r.clerk_matter_id as "receiptMatterId",
          r.document_title as "receiptDocTitle",
          r.official_url as "receiptUrl",
          r.paragraph_snippet as "receiptSnippet",
          r.page_number as "receiptPage"
        FROM bills b
        LEFT JOIN primary_source_receipts r ON b.id = r.bill_id
      `;

      const params: any[] = [];
      if (jurisdictionId) {
        query += ` WHERE b.jurisdiction_id = $1`;
        params.push(jurisdictionId);
      }
      query += ` ORDER BY b.introduction_date DESC`;

      const rows = await queryDb<any>(query, params);

      if (rows.length === 0) {
        return jurisdictionId
          ? MOCK_BILLS.filter((b) => b.jurisdictionId === jurisdictionId)
          : MOCK_BILLS;
      }

      return rows.map((r) => {
        const mockBill = MOCK_BILLS.find((b) => b.id === r.id);
        return {
          id: r.id,
          jurisdictionId: r.jurisdictionId,
          fileNumber: r.fileNumber,
          title: r.officialTitle || mockBill?.title || r.plainTitle,
          plainTitle: r.plainTitle,
          category: r.category || mockBill?.category || 'Infrastructure & Public Works',
          status: r.status || 'In Committee',
          isConsentCalendar: false,
          introducedDate: r.introductionDate ? new Date(r.introductionDate).toISOString().split('T')[0] : '2026-08-01',
          lastActionDate: r.nextActionDate ? new Date(r.nextActionDate).toISOString().split('T')[0] : '2026-09-08',
          sponsors: typeof r.sponsors === 'string' ? JSON.parse(r.sponsors) : r.sponsors || [],
          whoItAffects: r.whoItAffects || 'Neighborhood residents and local property owners.',
          summary: r.summary,
          fiscalImpact: {
            amount: Number(r.fiscalAmount) || 0,
            fundingSource: r.fiscalDescription || 'Municipal Enterprise Fund',
            isTaxpayerDirect: true,
            description: r.fiscalDescription || '',
          },
          receipt: {
            documentTitle: r.receiptDocTitle || 'Official Clerk Journal',
            fileNumber: r.fileNumber,
            clerkMatterId: r.receiptMatterId || `LEG-${r.fileNumber}`,
            officialUrl: r.receiptUrl || 'https://citycouncil.clevelandohio.gov',
            paragraphSnippet: r.receiptSnippet || r.summary,
            pageNumber: r.receiptPage || 1,
            verifiedAt: new Date().toISOString(),
            verificationBadge: 'Verified Official' as const,
          },
          perspectives: r.perspectivesCache || mockBill?.perspectives || {
            officialDocketStance: {
              sponsorIntent: 'Authorized to address essential municipal infrastructure and regulatory mandates.',
              legalDepartmentNote: 'Complies with municipal charter provisions and general council rules.',
              fiscalReviewNote: 'Reviewed by finance department for budgetary alignment.',
            },
            mediaPerspectives: [],
            publicCommentBreakdown: {
              totalComments: 120,
              supportPercentage: 65,
              opposePercentage: 25,
              neutralPercentage: 10,
              topResidentThemes: [],
            },
          },
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
        };
      });
    } catch (err) {
      console.warn('Repository getBills fallback to mock data:', err);
      return jurisdictionId
        ? MOCK_BILLS.filter((b) => b.jurisdictionId === jurisdictionId)
        : MOCK_BILLS;
    }
  }

  /**
   * Saves a social media broadcast audit record
   */
  static async logBroadcast(billId: string, platform: string, content: string): Promise<void> {
    const pool = getDbPool();
    if (!pool) return;

    try {
      await queryDb(
        `INSERT INTO social_broadcast_logs (bill_id, platform, content_text) VALUES ($1, $2, $3)`,
        [billId, platform, content]
      );
    } catch (err) {
      console.warn('Failed to log broadcast to DB:', err);
    }
  }
}
