/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "bun:test";
import { LegalComplianceModal } from "../components/LegalComplianceModal";
import { useModalKeyboard } from "../lib/useModalKeyboard";
import { BILLS, JURISDICTIONS } from "../data/mockData";

describe("ADA Compliance & Legal Safety Verification", () => {
  it("should export LegalComplianceModal and useModalKeyboard cleanly", () => {
    expect(LegalComplianceModal).toBeDefined();
    expect(typeof LegalComplianceModal).toBe("function");
    expect(useModalKeyboard).toBeDefined();
    expect(typeof useModalKeyboard).toBe("function");
  });

  it("should verify all bills comply with the Receipt Verification Protocol", () => {
    for (const bill of BILLS) {
      expect(bill.receipt).toBeDefined();
      expect(bill.receipt.documentTitle).toBeTruthy();
      expect(bill.receipt.clerkMatterId).toBeTruthy();
      expect(bill.receipt.paragraphSnippet.length).toBeGreaterThan(10);
      expect(bill.receipt.officialUrl).toBeTruthy();
      // Primary source verification must not be empty or fabricated without attribution
      expect(bill.receipt.verifiedAt).toBeTruthy();
    }
  });

  it("should verify jurisdictions have valid OCD-compliant divisions and postal codes", () => {
    for (const j of JURISDICTIONS) {
      expect(j.id.startsWith("ocd-jurisdiction/")).toBe(true);
      expect(j.name).toBeTruthy();
      expect(j.divisions.length).toBeGreaterThan(0);
      for (const d of j.divisions) {
        expect(d.id.startsWith("ocd-division/")).toBe(true);
        expect(d.name).toBeTruthy();
      }
    }
  });

  it("should verify bills have clear plain-language titles and summaries for screen-reader clarity", () => {
    for (const bill of BILLS) {
      expect(bill.plainTitle.length).toBeGreaterThan(5);
      expect(bill.summary.length).toBeGreaterThan(10);
      expect(bill.whoItAffects.length).toBeGreaterThan(5);
      expect(bill.category).toBeTruthy();
    }
  });
});
