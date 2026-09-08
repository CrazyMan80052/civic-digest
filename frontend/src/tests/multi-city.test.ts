import { describe, it, expect } from "bun:test";
import { CANONICAL_JURISDICTIONS, findJurisdictionByLocation } from "@/data/jurisdictions";
import { POST as addressLookupHandler } from "@/app/api/address/lookup/route";
import { NextRequest } from "next/server";

describe("Multi-City Architecture & Canonical Registry", () => {
  it("should contain all target US metropolitan jurisdictions with valid OCD metadata", () => {
    expect(CANONICAL_JURISDICTIONS.length).toBeGreaterThanOrEqual(7);

    const clientNames = CANONICAL_JURISDICTIONS.map((j) => j.clientIdentifier);
    expect(clientNames).toContain("dublin");
    expect(clientNames).toContain("cleveland");
    expect(clientNames).toContain("austin");
    expect(clientNames).toContain("sacramento");
    expect(clientNames).toContain("chicago");
    expect(clientNames).toContain("seattle");
    expect(clientNames).toContain("phila");
  });

  it("should accurately resolve jurisdictions by ZIP code or City/State", () => {
    // Dublin, OH
    const dublin = findJurisdictionByLocation(undefined, undefined, "43016");
    expect(dublin?.name).toBe("City of Dublin");
    expect(dublin?.state).toBe("OH");
    expect(dublin?.provider).toBe("custom_portal");

    // Cleveland, OH
    const cleveland = findJurisdictionByLocation(undefined, undefined, "44105");
    expect(cleveland?.name).toBe("City of Cleveland");
    expect(cleveland?.provider).toBe("legistar");

    // Austin, TX
    const austin = findJurisdictionByLocation(undefined, undefined, "78701");
    expect(austin?.name).toBe("City of Austin");

    // Chicago, IL
    const chicago = findJurisdictionByLocation("Chicago", "IL");
    expect(chicago?.name).toBe("City of Chicago");
    expect(chicago?.state).toBe("IL");

    // Seattle, WA
    const seattle = findJurisdictionByLocation("Seattle", "WA");
    expect(seattle?.name).toBe("City of Seattle");
    expect(seattle?.state).toBe("WA");

    // Philadelphia, PA
    const phila = findJurisdictionByLocation(undefined, undefined, "19102");
    expect(phila?.name).toBe("City of Philadelphia");
  });

  it("should resolve address lookup requests for different US cities without Dublin hardcoding", async () => {
    // Test Dublin
    const dublinReq = new NextRequest("http://localhost:3000/api/address/lookup", {
      method: "POST",
      body: JSON.stringify({ address: "5555 Perimeter Dr, Dublin, OH 43016" }),
    });
    const dublinRes = await addressLookupHandler(dublinReq);
    const dublinData = await dublinRes.json();
    expect(dublinData.matched).toBe(true);
    expect(dublinData.city).toBe("Dublin");
    expect(dublinData.state).toBe("OH");

    // Test Cleveland
    const cleReq = new NextRequest("http://localhost:3000/api/address/lookup", {
      method: "POST",
      body: JSON.stringify({ address: "Fleet Ave, Slavic Village, Cleveland, OH 44105" }),
    });
    const cleRes = await addressLookupHandler(cleReq);
    const cleData = await cleRes.json();
    expect(cleData.matched).toBe(true);
    expect(cleData.city).toBe("Cleveland");
    expect(cleData.matchedDivisionId).toContain("ward:12");

    // Test Austin
    const atxReq = new NextRequest("http://localhost:3000/api/address/lookup", {
      method: "POST",
      body: JSON.stringify({ address: "Montopolis, East Austin, TX 78702" }),
    });
    const atxRes = await addressLookupHandler(atxReq);
    const atxData = await atxRes.json();
    expect(atxData.matched).toBe(true);
    expect(atxData.city).toBe("Austin");
    expect(atxData.state).toBe("TX");

    // Test Chicago
    const chiReq = new NextRequest("http://localhost:3000/api/address/lookup", {
      method: "POST",
      body: JSON.stringify({ address: "121 N LaSalle St, Chicago, IL 60602" }),
    });
    const chiRes = await addressLookupHandler(chiReq);
    const chiData = await chiRes.json();
    expect(chiData.matched).toBe(true);
    expect(chiData.city).toBe("Chicago");
    expect(chiData.state).toBe("IL");
  });
});
