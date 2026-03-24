export interface College {
  name: string;
  tier: 'dream' | 'reach' | 'match' | 'safety';
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

export interface ParsedResults {
  story: string;
  colleges: College[];
  roadmap: string[];
  rightNow: string[];
}

export function parseResults(text: string): ParsedResults | null {
  const storyMatch = text.indexOf('── YOUR STORY ──');
  const listMatch = text.indexOf('── YOUR COLLEGE LIST ──');
  const roadmapMatch = text.indexOf('── YOUR ROADMAP ──');
  const strategyMatch = text.indexOf('── YOUR APPLICATION STRATEGY ──');
  const rightNowMatch = text.indexOf('── RIGHT NOW ──');

  if (listMatch === -1) return null;

  const result: ParsedResults = {
    story: '',
    colleges: [],
    roadmap: [],
    rightNow: []
  };

  // Parse Story
  if (storyMatch !== -1) {
    const endIdx = listMatch !== -1 ? listMatch : text.length;
    result.story = text.substring(storyMatch + '── YOUR STORY ──'.length, endIdx).trim();
  }

  // Parse College List
  const listEndIdx = roadmapMatch !== -1 ? roadmapMatch : (strategyMatch !== -1 ? strategyMatch : (rightNowMatch !== -1 ? rightNowMatch : text.length));
  const listText = text.substring(listMatch + '── YOUR COLLEGE LIST ──'.length, listEndIdx).trim();
  
  let currentTier: 'dream' | 'reach' | 'match' | 'safety' | null = null;
  const lines = listText.split('\n').map(l => l.trim()).filter(l => l);
  
  for (const line of lines) {
    if (line.toUpperCase().includes('DREAM (')) {
      currentTier = 'dream';
      continue;
    } else if (line.toUpperCase().includes('REACH (')) {
      currentTier = 'reach';
      continue;
    } else if (line.toUpperCase().includes('MATCH (')) {
      currentTier = 'match';
      continue;
    } else if (line.toUpperCase().includes('SAFETY (')) {
      currentTier = 'safety';
      continue;
    }
    
    if (currentTier && line.includes('—') && !line.startsWith('──')) {
      const parts = line.split('—');
      if (parts.length >= 2) {
        let name = parts[0].trim().replace(/\*\*/g, '').replace(/^- /g, '').trim();
        let reason = parts.slice(1).join('—').trim();
        if (name && reason) {
          result.colleges.push({ name, tier: currentTier, reason });
        }
      }
    }
  }

  // Parse Roadmap
  if (roadmapMatch !== -1) {
    const endIdx = strategyMatch !== -1 ? strategyMatch : (rightNowMatch !== -1 ? rightNowMatch : text.length);
    const roadmapText = text.substring(roadmapMatch + '── YOUR ROADMAP ──'.length, endIdx).trim();
    result.roadmap = roadmapText.split('\n').map(l => l.trim().replace(/^- /g, '').replace(/^\d+\.\s*/g, '')).filter(l => l);
  }

  // Parse Strategy (Deep Dives)
  if (strategyMatch !== -1) {
    const endIdx = rightNowMatch !== -1 ? rightNowMatch : text.length;
    const strategyText = text.substring(strategyMatch + '── YOUR APPLICATION STRATEGY ──'.length, endIdx).trim();
    
    for (let i = 0; i < result.colleges.length; i++) {
      const college = result.colleges[i];
      const nameRegex = new RegExp(`(?:\\*\\*|\\d+\\.\\s*\\*\\*|\\n\\s*)${escapeRegExp(college.name)}(?:\\*\\*|\\n|:)`, 'i');
      const match = strategyText.match(nameRegex);
      
      if (match) {
        const startIndex = match.index! + match[0].length;
        let endIndex = strategyText.length;
        for (let j = 0; j < result.colleges.length; j++) {
          if (i === j) continue;
          const nextMatch = strategyText.substring(startIndex).match(new RegExp(`(?:\\*\\*|\\d+\\.\\s*\\*\\*|\\n\\s*)${escapeRegExp(result.colleges[j].name)}(?:\\*\\*|\\n|:)`, 'i'));
          if (nextMatch && nextMatch.index! < endIndex) {
            endIndex = startIndex + nextMatch.index!;
          }
        }
        
        const diveContent = strategyText.substring(startIndex, endIndex);
        
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

  // Parse Right Now
  if (rightNowMatch !== -1) {
    const rightNowText = text.substring(rightNowMatch + '── RIGHT NOW ──'.length).trim();
    result.rightNow = rightNowText.split('\n').map(l => l.trim().replace(/^- /g, '').replace(/^\d+\.\s*/g, '').replace(/^\[\]\s*/g, '')).filter(l => l);
  }

  if (result.colleges.length === 0) return null;
  return result;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
