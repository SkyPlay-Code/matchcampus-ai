// src/utils/parser.ts
// Fuzzy section parser — handles any variation of section headers
// the AI might output (em-dashes, box chars, hyphens, caps, etc.)

export interface College {
  name: string;
  tier: 'dream' | 'reach' | 'match' | 'safety';
  reason: string;
  deepDive?: DeepDive;
}

export interface DeepDive {
  whyYouFit?: string;
  stats?: string;
  hook?: string;
  essayAngle?: string;
  strengthen?: string;
  insiderNote?: string;
}

export interface ParsedResults {
  story: string;
  colleges: College[];
  roadmap: string[];
  applicationStrategies: { school: string; deepDive: DeepDive }[];
  rightNow: string[];
}

// ─── Fuzzy section detector ───────────────────────────────────────
// Normalises a line to plain lowercase text, strips ALL decorator
// characters so we can match by keyword regardless of what the AI
// decided to use as a divider.
function normaliseLine(line: string): string {
  return line
    .replace(/[─—–\-=~*#|]/g, ' ')  // strip all dash/box/decorator chars
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Returns which section this line is a header for, or null
function detectSection(line: string): keyof ParsedResults | 'tier' | null {
  const n = normaliseLine(line);

  if (n.includes('your story'))            return 'story';
  if (n.includes('college list'))          return 'colleges';
  if (n.includes('your roadmap') ||
      n.includes('road map'))              return 'roadmap';
  if (n.includes('application strategy')) return 'applicationStrategies';
  if (n.includes('right now'))             return 'rightNow';

  return null;
}

function detectTier(line: string): College['tier'] | null {
  const n = normaliseLine(line);
  // Must be a short line that IS the tier label, not a sentence containing the word
  if (n.length > 40) return null;
  if (n.includes('dream'))  return 'dream';
  if (n.includes('reach'))  return 'reach';
  if (n.includes('match'))  return 'match';
  if (n.includes('safety') || n.includes('safe')) return 'safety';
  return null;
}

// ─── College line parser ──────────────────────────────────────────
// Handles formats like:
//   "IIT Bombay (CSE) — The gold standard..."
//   "**IIT Bombay** - The gold standard..."
//   "• IIT Bombay: The gold standard..."
function parseCollegeLine(
  line: string,
  tier: College['tier']
): College | null {
  // Strip markdown bold, bullets, leading numbers
  let clean = line
    .replace(/\*\*/g, '')
    .replace(/^[\s•\-\d.]+/, '')
    .trim();

  if (!clean || clean.length < 4) return null;

  // Split on first — or - or : that separates name from reason
  const separatorMatch = clean.match(/^(.+?)(?:\s[—–-]\s|\s*:\s)(.+)$/);
  if (separatorMatch) {
    return {
      name: separatorMatch[1].trim(),
      reason: separatorMatch[2].trim(),
      tier,
    };
  }

  // Fallback: whole line is just the name
  if (clean.length < 60) {
    return { name: clean, reason: '', tier };
  }

  return null;
}

// ─── Deep dive parser ────────────────────────────────────────────
const DEEP_DIVE_KEYS: { pattern: RegExp; field: keyof DeepDive }[] = [
  { pattern: /why\s*you\s*fit/i,      field: 'whyYouFit' },
  { pattern: /your\s*stats?/i,        field: 'stats' },
  { pattern: /your\s*hook/i,          field: 'hook' },
  { pattern: /essay\s*angle/i,        field: 'essayAngle' },
  { pattern: /strengthen/i,           field: 'strengthen' },
  { pattern: /insider\s*note/i,       field: 'insiderNote' },
];

function parseDeepDiveBlock(block: string): DeepDive {
  const dive: DeepDive = {};

  for (const { pattern, field } of DEEP_DIVE_KEYS) {
    // Match "FIELD: value" or "**FIELD:** value" on its own line
    const re = new RegExp(
      `(?:\\*{0,2})${pattern.source}(?:\\*{0,2}):?\\s*(.+?)(?=(?:\\*{0,2})(?:${
        DEEP_DIVE_KEYS.map(k => k.pattern.source).join('|')
      })|$)`,
      'is'
    );
    const m = block.match(re);
    if (m) {
      dive[field] = m[1].replace(/\n+/g, ' ').trim();
    }
  }

  return dive;
}

// ─── Roadmap / Right Now list parser ────────────────────────────
function parseListBlock(block: string): string[] {
  return block
    .split('\n')
    .map(l => l.replace(/^[\s•\-*\d.]+/, '').trim())
    .filter(l => l.length > 8);
}

// ─── Main parser ─────────────────────────────────────────────────
export function parseAIResponse(raw: string): ParsedResults | null {
  const lines = raw.split('\n');

  const sections: Record<string, string[]> = {
    story: [],
    colleges: [],
    roadmap: [],
    applicationStrategies: [],
    rightNow: [],
  };

  let currentSection: string | null = null;

  for (const line of lines) {
    const section = detectSection(line);
    if (section && section !== 'tier') {
      currentSection = section as string;
      continue;
    }
    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  // Must have at least a college list to consider this a results response
  if (sections.colleges.length === 0) return null;

  // ── Parse colleges ──
  const colleges: College[] = [];
  let currentTier: College['tier'] = 'match';

  for (const line of sections.colleges) {
    const tier = detectTier(line);
    if (tier) {
      currentTier = tier;
      continue;
    }
    const college = parseCollegeLine(line, currentTier);
    if (college) colleges.push(college);
  }

  if (colleges.length === 0) return null;

  // ── Parse application strategies ──
  const strategiesRaw = sections.applicationStrategies.join('\n');
  const strategyBlocks = strategiesRaw.split(/\n(?=[A-Z][A-Z\s]{2,}\n)/);
  const applicationStrategies: { school: string; deepDive: DeepDive }[] = [];

  for (const block of strategyBlocks) {
    const firstLine = block.split('\n')[0]
      .replace(/\*\*/g, '')
      .replace(/^[\s\-—]+/, '')
      .trim();

    if (firstLine.length > 2 && firstLine.length < 80) {
      applicationStrategies.push({
        school: firstLine,
        deepDive: parseDeepDiveBlock(block),
      });
    }
  }

  // Attach deep dives to matching colleges
  for (const strategy of applicationStrategies) {
    const match = colleges.find(c =>
      c.name.toLowerCase().includes(strategy.school.toLowerCase().slice(0, 10))
    );
    if (match) match.deepDive = strategy.deepDive;
  }

  return {
    story: sections.story.join('\n').trim(),
    colleges,
    roadmap: parseListBlock(sections.roadmap.join('\n')),
    applicationStrategies,
    rightNow: parseListBlock(sections.rightNow.join('\n')),
  };
}

// ─── Streaming helper ────────────────────────────────────────────
// Call this on every streamed chunk. Returns parsed results only
// when the full response is complete (all 5 sections present).
export function tryParseWhenComplete(raw: string): ParsedResults | null {
  const hasAllSections =
    /your story/i.test(raw) &&
    /college list/i.test(raw) &&
    /your roadmap/i.test(raw) &&
    /right now/i.test(raw);

  if (!hasAllSections) return null;
  return parseAIResponse(raw);
}
