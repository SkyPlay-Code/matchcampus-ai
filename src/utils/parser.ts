export interface College {
  name: string;
  tier: 'reach' | 'match' | 'safety';
  reason: string;
  deepDive?: {
    whyFit: string;
    stats: string;
    hook: string;
    essayAngle: string;
    strengthen: string;
    insiderNote: string;
  };
}

export function parseCollegeList(text: string): College[] {
  const colleges: College[] = [];
  
  const section2Match = text.indexOf('SECTION 2 — YOUR COLLEGE LIST');
  if (section2Match === -1) return colleges;
  
  const section3Match = text.indexOf('SECTION 3 — DEEP DIVES');
  const section4Match = text.indexOf('SECTION 4 — NEXT STEPS');
  
  const listText = text.substring(
    section2Match, 
    section3Match !== -1 ? section3Match : (section4Match !== -1 ? section4Match : text.length)
  );
  
  let currentTier: 'reach' | 'match' | 'safety' | null = null;
  
  const lines = listText.split('\n').map(l => l.trim()).filter(l => l);
  for (const line of lines) {
    if (line.toUpperCase().includes('REACH (')) {
      currentTier = 'reach';
      continue;
    } else if (line.toUpperCase().includes('MATCH (')) {
      currentTier = 'match';
      continue;
    } else if (line.toUpperCase().includes('SAFETY (')) {
      currentTier = 'safety';
      continue;
    }
    
    if (currentTier && line.includes('—') && !line.toUpperCase().startsWith('SECTION')) {
      // Parse [School Name] — [Reason]
      // Sometimes it might have bolding like **School Name** — Reason
      const parts = line.split('—');
      if (parts.length >= 2) {
        let name = parts[0].trim().replace(/\*\*/g, '').replace(/^- /g, '').trim();
        let reason = parts.slice(1).join('—').trim();
        if (name && reason) {
          colleges.push({ name, tier: currentTier, reason });
        }
      }
    }
  }
  
  // Parse deep dives if available
  if (section3Match !== -1) {
    const deepDiveText = text.substring(
      section3Match,
      section4Match !== -1 ? section4Match : text.length
    );
    
    // This is a rough parser for deep dives. It looks for school names that match the list.
    for (let i = 0; i < colleges.length; i++) {
      const college = colleges[i];
      // Look for the college name in the deep dive section
      // It might be bolded or have a number before it
      const nameRegex = new RegExp(`(?:\\*\\*|\\d+\\.\\s*\\*\\*|\\n\\s*)${escapeRegExp(college.name)}(?:\\*\\*|\\n|:)`, 'i');
      const match = deepDiveText.match(nameRegex);
      
      if (match) {
        const startIndex = match.index! + match[0].length;
        // Find the next college name or end of section to bound the search
        let endIndex = deepDiveText.length;
        for (let j = 0; j < colleges.length; j++) {
          if (i === j) continue;
          const nextMatch = deepDiveText.substring(startIndex).match(new RegExp(`(?:\\*\\*|\\d+\\.\\s*\\*\\*|\\n\\s*)${escapeRegExp(colleges[j].name)}(?:\\*\\*|\\n|:)`, 'i'));
          if (nextMatch && nextMatch.index! < endIndex) {
            endIndex = startIndex + nextMatch.index!;
          }
        }
        
        const diveContent = deepDiveText.substring(startIndex, endIndex);
        
        const extractField = (fieldName: string) => {
          const regex = new RegExp(`${fieldName}:\\s*(.*?)(?=\\n[A-Z\\s]+:|$)`, 'is');
          const m = diveContent.match(regex);
          return m ? m[1].trim() : '';
        };
        
        const whyFit = extractField('WHY YOU FIT');
        const stats = extractField('YOUR STATS');
        const hook = extractField('YOUR HOOK');
        const essayAngle = extractField('ESSAY ANGLE');
        const strengthen = extractField('STRENGTHEN');
        const insiderNote = extractField('INSIDER NOTE');
        
        if (whyFit || stats || hook || essayAngle || strengthen || insiderNote) {
          college.deepDive = { whyFit, stats, hook, essayAngle, strengthen, insiderNote };
        }
      }
    }
  }
  
  return colleges;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
