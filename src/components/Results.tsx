import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { College, ParsedResults } from '../utils/parser';
import { X, Bookmark, ChevronRight, CheckCircle2, Circle, MapPin, Target, Sparkles, ShieldCheck, MessageSquare } from 'lucide-react';

interface ResultsProps {
  results: ParsedResults;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
  onAskAbout: (schoolName: string) => void;
  checklistState: Record<string, boolean>;
  onToggleChecklist: (id: string) => void;
}

export function Results({ results, onSave, isSaving, onClose, onAskAbout, checklistState, onToggleChecklist }: ResultsProps) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const dream = results.colleges.filter(c => c.tier === 'dream');
  const reach = results.colleges.filter(c => c.tier === 'reach');
  const match = results.colleges.filter(c => c.tier === 'match');
  const safety = results.colleges.filter(c => c.tier === 'safety');

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full md:w-[60%] bg-[#0f1923] shadow-2xl border-l border-slate-800 flex flex-col z-40"
      >
        <div className="p-6 bg-[#0f1923] border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">Your College Strategy</h2>
            <p className="text-sm text-slate-400 mt-1">Tailored to your unique profile</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Bookmark className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save My List'}</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* Student Story */}
          {results.story && (
            <section>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="text-lg font-serif font-bold text-white mb-3 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Your Story</span>
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">{results.story}</p>
              </div>
            </section>
          )}

          {/* College List Swimlanes */}
          <section>
            <h3 className="text-lg font-serif font-bold text-white mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>Your College List</span>
            </h3>
            <div className="flex overflow-x-auto pb-6 -mx-6 px-6 space-x-6 snap-x">
              <Swimlane title="Dream" colleges={dream} color="purple" onSelect={setSelectedCollege} />
              <Swimlane title="Reach" colleges={reach} color="orange" onSelect={setSelectedCollege} />
              <Swimlane title="Match" colleges={match} color="blue" onSelect={setSelectedCollege} />
              <Swimlane title="Safety" colleges={safety} color="green" onSelect={setSelectedCollege} />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Roadmap */}
            {results.roadmap.length > 0 && (
              <section>
                <h3 className="text-lg font-serif font-bold text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  <span>Your Roadmap</span>
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {results.roadmap.map((step, idx) => {
                    const id = `roadmap-${idx}`;
                    const isChecked = checklistState[id] || false;
                    return (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-900 text-slate-500 group-[.is-active]:text-amber-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 cursor-pointer" onClick={() => onToggleChecklist(id)}>
                          {isChecked ? <CheckCircle2 className="w-5 h-5 text-amber-500" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow">
                          <p className={`text-sm ${isChecked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{step}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Right Now */}
            {results.rightNow.length > 0 && (
              <section>
                <h3 className="text-lg font-serif font-bold text-white mb-4 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Right Now</span>
                </h3>
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50">
                  <ul className="space-y-3">
                    {results.rightNow.map((item, idx) => {
                      const id = `rightnow-${idx}`;
                      const isChecked = checklistState[id] || false;
                      return (
                        <li key={idx} className="flex items-start space-x-3 cursor-pointer group" onClick={() => onToggleChecklist(id)}>
                          <div className="mt-0.5 flex-shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-amber-500 transition-colors" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                            )}
                          </div>
                          <span className={`text-sm leading-relaxed transition-colors ${isChecked ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>
                            {item}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedCollege && (
          <DeepDiveModal 
            college={selectedCollege} 
            onClose={() => setSelectedCollege(null)} 
            onAskAbout={() => {
              onAskAbout(selectedCollege.name);
              setSelectedCollege(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Swimlane({ title, colleges, color, onSelect }: { title: string, colleges: College[], color: string, onSelect: (c: College) => void }) {
  if (colleges.length === 0) return null;

  const colorStyles = {
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/15 text-green-400 border-green-500/20',
  }[color];

  return (
    <div className="w-72 flex-shrink-0 snap-start">
      <div className="flex items-center space-x-2 mb-4">
        <h4 className="font-bold text-white uppercase tracking-wider text-sm">{title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${colorStyles}`}>{colleges.length}</span>
      </div>
      <div className="space-y-3">
        {colleges.map((college, idx) => (
          <div 
            key={idx} 
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:-translate-y-1 hover:shadow-lg hover:bg-white/10 transition-all duration-200 group cursor-pointer"
            onClick={() => onSelect(college)}
          >
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-bold text-white text-base leading-tight">{college.name}</h5>
            </div>
            <p className="text-xs text-slate-400 line-clamp-3 mb-4">{college.reason}</p>
            <div className="flex items-center text-xs font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View Strategy</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeepDiveModal({ college, onClose, onAskAbout }: { college: College, onClose: () => void, onAskAbout: () => void }) {
  const hasDeepDive = !!college.deepDive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-800/50">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">{college.tier}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">{college.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {hasDeepDive ? (
            <div className="space-y-6">
              {college.deepDive?.whyFit && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>📌</span> <span>Why You Fit</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{college.deepDive.whyFit}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {college.deepDive?.stats && (
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                      <span>📊</span> <span>Your Stats vs Theirs</span>
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{college.deepDive.stats}</p>
                  </div>
                )}
                
                {college.deepDive?.hook && (
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                      <span>🪝</span> <span>Your Hook</span>
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{college.deepDive.hook}</p>
                  </div>
                )}
              </div>

              {college.deepDive?.essayAngle && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>✍️</span> <span>Essay Angle</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{college.deepDive.essayAngle}</p>
                </div>
              )}

              {college.deepDive?.strengthen && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>💪</span> <span>What To Strengthen</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{college.deepDive.strengthen}</p>
                </div>
              )}

              {college.deepDive?.insiderNote && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>🔍</span> <span>Insider Note</span>
                  </h3>
                  <p className="text-amber-200/80 text-sm leading-relaxed">{college.deepDive.insiderNote}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Want the full strategy?</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                I only generated deep dives for your top matches to save time, but I can analyze {college.name} for you right now.
              </p>
              <button 
                onClick={onAskAbout}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Ask about {college.name}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
