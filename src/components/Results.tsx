import React, { useState } from 'react';
import { ParsedResults, College } from '../utils/parser';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';

interface ResultsProps {
  results: ParsedResults;
  onSave: () => Promise<void>;
  checklistState: Record<string, boolean>;
  onToggleChecklist: (id: string) => void;
  onAskAbout: (topic: string) => void;
  onClose?: () => void;
}

export function Results({ results, onSave, checklistState, onToggleChecklist, onAskAbout, onClose }: ResultsProps) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSaveClick = async () => {
    setSaveStatus('saving');
    await onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const dream = results.colleges.filter(c => c.tier === 'dream');
  const reach = results.colleges.filter(c => c.tier === 'reach');
  const match = results.colleges.filter(c => c.tier === 'match');
  const safety = results.colleges.filter(c => c.tier === 'safety');

  return (
    <div className="h-full flex flex-col bg-[#0d1424] border-l border-white/5 overflow-y-auto no-scrollbar">
      <div className="p-4 sm:p-6 bg-[#0d1424] border-b border-white/5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 -ml-1.5 text-[#64748b] hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-[16px] sm:text-[18px] font-bold text-white">Your College List</h2>
            <p className="text-[12px] sm:text-[13px] text-[#64748b] mt-0.5">Based on your conversation</p>
          </div>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={saveStatus !== 'idle'}
          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-[#0a0f1c] px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-semibold transition-colors disabled:opacity-80"
        >
          {saveStatus === 'saved' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved ✓</span>
            </>
          ) : saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span>Save My List</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {results.story && (
          <section>
            <StudentStory story={results.story} />
          </section>
        )}

        <section>
          <TierSection title="Dream" colleges={dream} color="dream" onSelect={setSelectedCollege} />
          <TierSection title="Reach" colleges={reach} color="reach" onSelect={setSelectedCollege} />
          <TierSection title="Match" colleges={match} color="match" onSelect={setSelectedCollege} />
          <TierSection title="Safety" colleges={safety} color="safety" onSelect={setSelectedCollege} />
        </section>

        {results.roadmap.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[16px] font-bold text-white mb-4">Your Roadmap</h3>
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-[2px] before:bg-white/10">
              {results.roadmap.map((step, idx) => {
                const id = `roadmap-${idx}`;
                const isChecked = checklistState[id] || false;
                return (
                  <div key={idx} className="relative flex items-start py-3 group">
                    <div 
                      className="flex items-center justify-center w-6 h-6 rounded bg-[#0d1424] border-2 border-amber-500 text-amber-500 shrink-0 z-10 cursor-pointer mt-0.5" 
                      onClick={() => onToggleChecklist(id)}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="ml-4">
                      <p className={`text-[14px] leading-relaxed transition-colors ${isChecked ? 'text-[#475569] line-through' : 'text-[#cbd5e1]'}`}>{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {results.rightNow.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[16px] font-bold text-white mb-4">Do This Now</h3>
            <div className="space-y-3">
              {results.rightNow.map((item, idx) => {
                const id = `rightnow-${idx}`;
                const isChecked = checklistState[id] || false;
                return (
                  <div key={idx} className="flex items-start space-x-3 cursor-pointer group" onClick={() => onToggleChecklist(id)}>
                    <div className="flex items-center justify-center w-6 h-6 rounded border-2 border-amber-500 text-amber-500 shrink-0 mt-0.5 transition-colors">
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className={`text-[14px] leading-relaxed transition-colors ${isChecked ? 'text-[#475569] line-through' : 'text-[#cbd5e1]'}`}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedCollege && (
          <DeepDiveModal 
            college={selectedCollege} 
            onClose={() => setSelectedCollege(null)} 
            onAskAbout={() => {
              onAskAbout(`Tell me more about getting into ${selectedCollege.name}`);
              setSelectedCollege(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentStory({ story }: { story: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = story.length > 80 ? story.substring(0, 80) + '...' : story;

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 cursor-pointer hover:bg-amber-500/10 transition-colors"
    >
      <p className="text-[#94a3b8] text-[14px] italic leading-relaxed">
        {expanded ? story : preview}
      </p>
    </div>
  );
}

function TierSection({ title, colleges, color, onSelect }: { title: string, colleges: College[], color: string, onSelect: (c: College) => void }) {
  if (colleges.length === 0) return null;

  const colorStyles = {
    dream: 'bg-[#3b0764] text-[#a855f7]',
    reach: 'bg-[#431407] text-[#f97316]',
    match: 'bg-[#0c1a4a] text-[#60a5fa]',
    safety: 'bg-[#052e16] text-[#4ade80]',
  }[color as keyof typeof colorStyles];

  return (
    <div className="mb-8">
      <div className="mb-3">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${colorStyles}`}>
          {title}
        </span>
      </div>
      <div className="space-y-2.5">
        {colleges.map((college, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            key={idx} 
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-200 group"
          >
            <div className="flex justify-between items-start mb-1.5">
              <h5 className="font-semibold text-white text-[15px]">{college.name}</h5>
            </div>
            <p className="text-[13px] text-[#94a3b8] italic leading-relaxed">{college.reason}</p>
            {college.deepDive && (
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => onSelect(college)}
                  className="text-[12px] font-medium text-amber-500 hover:text-amber-400 transition-colors flex items-center"
                >
                  View Strategy <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DeepDiveModal({ college, onClose, onAskAbout }: { college: College, onClose: () => void, onAskAbout: () => void }) {
  const hasDeepDive = !!college.deepDive;

  const sections = [
    { id: 'whyFit', icon: '📌', label: 'Why You Fit', content: college.deepDive?.whyYouFit },
    { id: 'stats', icon: '📊', label: 'Your Stats', content: college.deepDive?.stats },
    { id: 'hook', icon: '🪝', label: 'Your Hook', content: college.deepDive?.hook },
    { id: 'essayAngle', icon: '✍️', label: 'Essay Angle', content: college.deepDive?.essayAngle },
    { id: 'strengthen', icon: '💪', label: 'Strengthen', content: college.deepDive?.strengthen },
    { id: 'insiderNote', icon: '🔍', label: 'Insider Note', content: college.deepDive?.insiderNote },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-[640px] bg-[#111827] rounded-[16px] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh]"
      >
        <div className="px-[28px] pt-[24px] pb-[16px] border-b border-white/5 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                college.tier === 'dream' ? 'bg-[#3b0764] text-[#a855f7]' :
                college.tier === 'reach' ? 'bg-[#431407] text-[#f97316]' :
                college.tier === 'match' ? 'bg-[#0c1a4a] text-[#60a5fa]' :
                'bg-[#052e16] text-[#4ade80]'
              }`}>
                {college.tier}
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-white">{college.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748b] hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-[24px] sm:px-[28px] overflow-y-auto no-scrollbar">
          {hasDeepDive ? (
             <div className="space-y-0">
              {sections.map((sec, idx) => (
                <AccordionSection key={sec.id} icon={sec.icon} label={sec.label} content={sec.content} isLast={idx === sections.length - 1} onAskAbout={onAskAbout} collegeName={college.name} />
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function AccordionSection({ icon, label, content, isLast, onAskAbout, collegeName }: { icon: string, label: string, content?: string, isLast: boolean, onAskAbout: () => void, collegeName: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`py-4 ${!isLast ? 'border-b border-white/5' : ''}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none group"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <span className="text-[15px] font-semibold text-white group-hover:text-amber-500 transition-colors">{label}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-[#64748b] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-8">
              {content ? (
                <p className="text-[#94a3b8] text-[14px] leading-[1.7]">{content}</p>
              ) : (
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-[#64748b] text-[14px]">Ask CampusMatch about this →</span>
                  <button 
                    onClick={onAskAbout}
                    className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors border border-white/10"
                  >
                    Ask about {collegeName}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
