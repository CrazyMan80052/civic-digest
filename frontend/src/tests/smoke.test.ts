import { describe, it, expect } from "bun:test";
import { JURISDICTIONS, BILLS } from "../data/mockData";

describe("Frontend Core Datasets & OCD Models", () => {
  it("should provide valid default jurisdiction presets", () => {
    expect(JURISDICTIONS.length).toBeGreaterThanOrEqual(1);
    const cleveland = JURISDICTIONS.find((j) => j.name.toLowerCase().includes("cleveland"));
    expect(cleveland).toBeDefined();
    expect(cleveland?.state).toBe("OH");
    expect(cleveland?.divisions.length).toBeGreaterThan(0);
  });

  it("should provide valid OCD bills with required fields", () => {
    expect(BILLS.length).toBeGreaterThan(0);
    const firstBill = BILLS[0];
    expect(firstBill.id).toBeDefined();
    expect(firstBill.id.startsWith("ocd-bill/")).toBe(true);
    expect(firstBill.plainTitle).toBeDefined();
    expect(firstBill.category).toBeDefined();
    expect(firstBill.status).toBeDefined();
  });
});
