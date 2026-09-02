-- ==============================================================================
-- CivicDigest - Open Civic Data (OCD-ID) PostgreSQL Seed Script
-- ==============================================================================

-- 1. Insert Cleveland & Austin Municipal Jurisdictions
INSERT INTO jurisdictions (id, name, classification, state_code, division_id, council_size, next_hearing_date, active_ordinance_count)
VALUES 
(
  'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
  'City of Cleveland',
  'municipality',
  'OH',
  'ocd-division/country:us/state:oh/place:cleveland',
  17,
  '2026-09-08 18:00:00+00',
  14
),
(
  'ocd-jurisdiction/country:us/state:tx/place:austin/government',
  'City of Austin',
  'municipality',
  'TX',
  'ocd-division/country:us/state:tx/place:austin',
  11,
  '2026-09-10 14:00:00+00',
  22
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Insert Cleveland Council Members
INSERT INTO council_members (id, jurisdiction_id, name, ward_or_district, title, attendance_rate, sponsored_bills_count)
VALUES
('ocd-person/cleveland-councildistrict-12', 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government', 'Rebecca Maurer', 'Ward 12 (Slavic Village)', 'Council Member', 98.2, 14),
('ocd-person/cleveland-councildistrict-3', 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government', 'Kerry McCormack', 'Ward 3 (Downtown / Ohio City)', 'Council Majority Leader', 96.5, 23),
('ocd-person/cleveland-councildistrict-15', 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government', 'Jenny Spencer', 'Ward 15 (Detroit Shoreway)', 'Council Member', 97.0, 18),
('ocd-person/cleveland-councildistrict-6', 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government', 'Blaine A. Griffin', 'Ward 6 (Buckeye-Shaker)', 'Council President', 99.0, 31)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Verified Dockets & Bills
INSERT INTO bills (
  id, jurisdiction_id, file_number, official_title, plain_title, category, status,
  introduction_date, next_action_date, sponsors, affected_wards, who_it_affects, summary,
  fiscal_amount, fiscal_type, fiscal_description, committee_name, location, tags
) VALUES
(
  'ocd-bill/2026-cleveland-ord-882',
  'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
  'Ord. 882-2026',
  'An emergency ordinance authorizing the Director of Capital Projects to issue grants and execute storm-water sewer easements in Slavic Village Ward 12 for mitigation of flash flooding.',
  'Slavic Village Stormwater & Flood Resilience Fund',
  'Environment & Infrastructure',
  'In Committee',
  '2026-08-14',
  '2026-09-08',
  '["Rebecca Maurer", "Blaine Griffin"]'::jsonb,
  '["12"]'::jsonb,
  'Residents living between Fleet Ave and Broadway with recurring basement sewage backups.',
  'Allocates $4.2M in municipal bond proceeds to replace 1920s combined storm-sewer mains and install backflow preventer valves in residential basements across Ward 12.',
  4200000.00,
  'One-Time Capital',
  '$4.2M from municipal stormwater bond fund.',
  'Municipal Services and Infrastructure Committee',
  'City Hall Council Chambers, Room 217',
  '["Flood Mitigation", "Infrastructure", "Ward 12", "Capital Budget"]'::jsonb
),
(
  'ocd-bill/2026-cleveland-ord-904',
  'ocd-jurisdiction/country:us/state:oh/place:cleveland/government',
  'Ord. 904-2026',
  'An ordinance to amend Chapter 343 of the Codified Ordinances of Cleveland regarding off-street parking minimums within 0.5 miles of high-frequency transit corridors.',
  'Transit-Oriented Parking Minimum Elimination',
  'Zoning & Land Use',
  'Hearing Scheduled',
  '2026-08-18',
  '2026-09-15',
  '["Kerry McCormack", "Jenny Spencer"]'::jsonb,
  '["3", "15", "7", "5"]'::jsonb,
  'Property owners, multi-family housing developers, and small business operators along RTA Red Line & HealthLine corridors.',
  'Abolishes mandatory minimum car parking ratios for new commercial and multi-family construction situated within a 10-minute walk of rapid transit stations.',
  0.00,
  'Regulatory',
  'Non-general fund fiscal impact; estimated to reduce housing construction costs by $18k-$25k per unit.',
  'Development, Planning and Sustainability Committee',
  'City Hall Council Chambers, Room 217',
  '["Zoning", "Housing Affordability", "Transit", "Parking Reform"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Primary Source Receipt Citations
INSERT INTO primary_source_receipts (
  bill_id, file_number, clerk_matter_id, document_title, official_url, paragraph_snippet, page_number
) VALUES
(
  'ocd-bill/2026-cleveland-ord-882',
  'Ord. 882-2026',
  'LEG-882-2026-V1',
  'Cleveland City Record - Vol. 113 No. 33',
  'https://citycouncil.clevelandohio.gov/records/2026/ord-882.pdf',
  'Sec. 2. That the Director of Capital Projects is hereby authorized to expend an amount not to exceed $4,200,000 from the Storm Water Infrastructure Fund (Fund No. 4180-2026) for engineering design, valve subsidies, and easement acquisition.',
  14
),
(
  'ocd-bill/2026-cleveland-ord-904',
  'Ord. 904-2026',
  'LEG-904-2026-V2',
  'Cleveland City Record - Planning Docket #44',
  'https://citycouncil.clevelandohio.gov/records/2026/ord-904.pdf',
  'Section 343.09(b): Off-Street Parking requirements shall be zero (0) stalls per dwelling unit for any residential or mixed-use structure within 2,640 feet of a designated Rapid Transit Station or Priority Bus Corridor.',
  7
)
ON CONFLICT (bill_id) DO NOTHING;
