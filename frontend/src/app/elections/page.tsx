'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ExternalLink, Info, MapPin, ShieldCheck } from 'lucide-react';

const ELECTIONS = {
  sampleBallot: 'https://lookup.boe.ohio.gov/vtrapp/union/getballot.aspx?elect=20261103g_webeix0&prsid=13____1&bpty=X',
  ballotList: 'https://lookup.boe.ohio.gov/vtrapp/union/ballotlist.aspx',
  voterLookup: 'https://lookup.boe.ohio.gov/vtrapp/union/vtrlookup.aspx',
  ballotDirectory: 'https://www.ohiosos.gov/directories/sample-ballot',
};

const TOPICS = [
  { id: 'costs', label: 'Cost of living & taxes' },
  { id: 'education', label: 'Public education' },
  { id: 'safety', label: 'Public safety' },
];

type Position = { summary: string; source: string; url: string };
type Candidate = {
  id: string;
  name: string;
  party: string;
  positions: Record<string, Position>;
  overview?: Position;
};

const CANDIDATES: Candidate[] = [
  {
    id: 'acton',
    name: 'Amy Acton & David Pepper',
    party: 'Democratic',
    positions: {
      costs: {
        summary: 'Proposes a working-families tax cut and child tax credit, alongside plans addressing health care, energy costs, and consumer fees.',
        source: 'ActOn Affordability Agenda',
        url: 'https://actonforgovernor.com/agenda/affordability-agenda/',
      },
      education: {
        summary: 'Says she would restore public-school funding to a constitutional level and implement the bipartisan Fair School Funding Plan.',
        source: 'Improving Ohio’s Education',
        url: 'https://actonforgovernor.com/issue/education/',
      },
      safety: {
        summary: 'Proposes stronger state and local partnerships, funding for local law enforcement and first responders, and investment in treatment and community programs.',
        source: 'Building Safer Communities',
        url: 'https://actonforgovernor.com/issue/building-safer-communities/',
      },
    },
  },
  {
    id: 'ramaswamy',
    name: 'Vivek Ramaswamy & Rob McColley',
    party: 'Republican',
    positions: {
      costs: {
        summary: 'Proposes property-tax reductions, phasing out the state income tax, expanding energy supply, and reducing regulatory barriers.',
        source: 'The Plan',
        url: 'https://vivekforohio.com/the-plan/',
      },
      education: {
        summary: 'Proposes academic benchmarks, more parent choice, merit-based teacher pay, and expanded career-technical education and apprenticeships.',
        source: 'The Plan',
        url: 'https://vivekforohio.com/the-plan/',
      },
      safety: {
        summary: 'Proposes stricter bail and sentencing for repeat violent offenders and expanded authority and support for local law enforcement.',
        source: 'The Plan',
        url: 'https://vivekforohio.com/the-plan/',
      },
    },
  },
  {
    id: 'kissick',
    name: 'Don Kissick & James L. Mills',
    party: 'Libertarian',
    positions: {},
    overview: {
      summary: 'The campaign page reviewed describes its guiding principles but does not provide enough issue-specific detail for this comparison. We leave those positions blank rather than infer them.',
      source: 'Campaign website',
      url: 'https://donkissick.com/',
    },
  },
];

const LAST_UPDATED = 'October 14, 2026';

export default function ElectionsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showLookupOptions, setShowLookupOptions] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('civicdigest-election-topics');
      if (saved) setSelectedTopics(JSON.parse(saved));
    } catch {
      // The guide still works if local storage is unavailable.
    }
  }, []);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((current) => {
      const next = current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic];
      try {
        window.localStorage.setItem('civicdigest-election-topics', JSON.stringify(next));
      } catch {
        // Keep the selection for this page view if local storage is unavailable.
      }
      return next;
    });
  };

  const topicsToShow = selectedTopics.length > 0 ? TOPICS.filter((topic) => selectedTopics.includes(topic.id)) : TOPICS;

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-[#1b211d]">
      <header className="border-b border-[#d8ddd5] bg-[#fbfaf6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-serif text-xl font-black tracking-tight text-[#183b2c]">CivicDigest</Link>
          <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/" className="text-[#65736a] transition hover:text-[#183b2c]">Civic briefings</Link>
            <Link href="/elections" aria-current="page" className="border-b-2 border-[#b45b35] pb-1 text-[#183b2c]">Elections</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-14">
        <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#68766b]">
          <span>Ohio election guide</span><span aria-hidden="true">/</span><span>2026 general</span>
        </div>

        <section className="grid gap-8 border-b border-[#cdd4cb] pb-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#9b4c2d]"><span className="h-px w-8 bg-[#9b4c2d]" />A clear guide to your local ballot</p>
            <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Know what’s on your ballot. See what candidates say.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#59645c] sm:text-lg">Start with the official ballot, choose the issues you care about, and compare candidates using links to their own published positions.</p>
          </div>
          <div className="rounded-xl border border-[#d6dcd3] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[#183b2c]"><MapPin className="h-4 w-4" />Ohio pilot</div>
            <div className="mt-4 flex items-start justify-between gap-4 border-t border-[#edf0eb] pt-4">
              <div>
                <p className="font-serif text-xl font-bold">Union County</p>
                <p className="mt-1 text-sm text-[#667168]">General election · November 3, 2026</p>
              </div>
              <span className="rounded-full bg-[#eef3ed] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#315f43]">Pilot</span>
            </div>
            <a href={ELECTIONS.sampleBallot} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#183b2c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#24543e]">
              Open example sample ballot <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs leading-5 text-[#748078]">Example style: Dublin City 2. Your ballot may differ by district.</p>
          </div>
        </section>

        <section className="grid gap-10 border-b border-[#cdd4cb] py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b4c2d]">01 · Find your ballot</p>
            <h2 className="mt-3 font-serif text-3xl font-bold">Use the county’s official lookup</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#59645c]">Ohio sample ballots are organized by county, and local races can vary by district. Browse available ballot styles or use the county’s voter lookup to confirm yours.</p>
            <div className="mt-5 flex flex-col items-start gap-3">
              <a href={ELECTIONS.ballotList} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#183b2c] px-4 py-2.5 text-sm font-bold text-[#183b2c] transition hover:bg-[#edf2ec]">Browse Union County ballot styles <ExternalLink className="h-4 w-4" /></a>
              <button type="button" aria-expanded={showLookupOptions} onClick={() => setShowLookupOptions((value) => !value)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#59645c] underline decoration-[#adb9af] underline-offset-4">
                Need help identifying your style? <ChevronDown className={`h-4 w-4 transition ${showLookupOptions ? 'rotate-180' : ''}`} />
              </button>
              {showLookupOptions && <div className="max-w-lg rounded-lg bg-[#eef1eb] p-4 text-sm leading-6 text-[#59645c]">The official voter lookup asks for identifying information. You’ll enter it directly on the Board of Elections website; CivicDigest does not request or receive it. <a className="font-bold text-[#183b2c] underline underline-offset-2" href={ELECTIONS.voterLookup} target="_blank" rel="noreferrer">Open Union County voter lookup</a>.</div>}
              <a href={ELECTIONS.ballotDirectory} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#637168] underline underline-offset-2">Find your county’s official ballot page</a>
            </div>
          </div>

          <div className="rounded-xl border border-[#d6dcd3] bg-white p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3ed] text-[#315f43]"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <h3 className="font-serif text-xl font-bold">Your ballot stays with you</h3>
                <p className="mt-1 text-sm leading-6 text-[#667168]">This page links to official lookup tools. It never asks for your name, home address, or voter ID. Your issue selections are saved only in this browser.</p>
              </div>
            </div>
            <div className="mt-6 border-t border-[#edf0eb] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">What issues should we show?</p>
                  <p className="mt-1 text-xs text-[#748078]">Choose any; leave them blank to see all available topics.</p>
                </div>
                {selectedTopics.length > 0 && <button onClick={() => { setSelectedTopics([]); try { localStorage.removeItem('civicdigest-election-topics'); } catch {} }} className="text-xs font-semibold text-[#65736a] underline underline-offset-2">Clear</button>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {TOPICS.map((topic) => {
                  const checked = selectedTopics.includes(topic.id);
                  return <button key={topic.id} type="button" aria-pressed={checked} onClick={() => toggleTopic(topic.id)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${checked ? 'border-[#315f43] bg-[#edf3ed] text-[#244a34]' : 'border-[#d8ddd5] bg-white text-[#58645b] hover:border-[#829488]'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-[#315f43] bg-[#315f43] text-white' : 'border-[#aab4aa]'}`}>{checked && <Check className="h-3 w-3" />}</span>{topic.label}
                  </button>;
                })}
              </div>
              <p className="mt-4 text-xs text-[#7a857c]">These choices filter the comparison below; they do not create an endorsement or ranking.</p>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b4c2d]">02 · Compare published positions</p>
              <h2 className="mt-3 font-serif text-3xl font-bold">Governor &amp; lieutenant governor</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645c]">Candidates and party labels are transcribed from the example ballot. Position summaries link to campaign materials and are not endorsements.</p>
            </div>
            <span className="text-xs font-medium text-[#748078]">Sources checked {LAST_UPDATED}</span>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#d6dcd3] bg-white">
            <div className="grid grid-cols-[minmax(130px,0.55fr)_repeat(3,minmax(190px,1fr))] overflow-x-auto">
              <div className="sticky left-0 z-10 min-w-[130px] border-b border-r border-[#e4e9e2] bg-[#f1f3ee] p-4 text-xs font-bold uppercase tracking-wider text-[#68766b]">Issue</div>
              {CANDIDATES.map((candidate) => <div key={candidate.id} className="min-w-[190px] border-b border-r border-[#e4e9e2] p-4 last:border-r-0">
                <p className="font-serif text-base font-bold leading-5">{candidate.name}</p>
                <p className="mt-1 text-xs text-[#728075]">{candidate.party}</p>
              </div>)}
              {topicsToShow.map((topic) => <div className="contents" key={topic.id}>
                <div className="sticky left-0 z-10 min-w-[130px] border-b border-r border-[#e4e9e2] bg-[#fbfaf6] p-4 text-sm font-bold">{topic.label}</div>
                {CANDIDATES.map((candidate) => {
                  const position = candidate.positions[topic.id];
                  return <div key={`${candidate.id}-${topic.id}`} className="min-w-[190px] border-b border-r border-[#e4e9e2] p-4 last:border-r-0">
                    {position ? <><p className="text-sm leading-6 text-[#465249]">{position.summary}</p><a href={position.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#315f43] underline decoration-[#a9b9ac] underline-offset-2">{position.source}<ExternalLink className="h-3 w-3" /></a></> : <><p className="text-xs font-bold uppercase tracking-wide text-[#7b6b4c]">Not enough detail found</p><p className="mt-2 text-sm leading-5 text-[#667168]">No issue-specific position was available in the campaign source reviewed. We don’t infer one.</p><a href={candidate.overview?.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#315f43] underline decoration-[#a9b9ac] underline-offset-2">{candidate.overview?.source}<ExternalLink className="h-3 w-3" /></a></>}
                  </div>;
                })}
              </div>)}
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#748078]"><Info className="mt-0.5 h-4 w-4 shrink-0" />Campaign pages describe candidates’ own proposals. They may not cover every issue, and positions can change. Check the cited source for the full context.</p>
        </section>

        <section className="grid gap-6 rounded-xl bg-[#183b2c] p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c5d7ca]">Next in CivicDigest</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">More counties. More local races. Better sourced answers.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d8e2da]">This pilot keeps the official ballot as the source of what’s on your ballot and makes the evidence behind each comparison visible.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-sm font-bold transition hover:bg-white/10">Back to CivicDigest <ArrowDown className="h-4 w-4 rotate-[-90deg]" /></Link>
        </section>
      </div>
    </main>
  );
}

