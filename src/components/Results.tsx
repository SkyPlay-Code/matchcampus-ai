import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { College } from '../utils/parser';
import { X, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsProps {
  colleges: College[];
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
}

export function Results({ colleges, onSave, isSaving, onClose }: ResultsProps) {
  const reach = colleges.filter(c => c.tier === 'reach');
  const match = colleges.filter(c => c.tier === 'match');
  const safety = colleges.filter(c => c.tier === 'safety');

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col z-50"
    >
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Your College List</h2>
          <p className="text-sm text-slate-500 mt-1">Tailored to your unique profile</p>
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <CollegeSection title="Reach" description="Ambitious but worth applying" colleges={reach} color="bg-rose-100 text-rose-700 border-rose-200" />
        <CollegeSection title="Match" description="Strong realistic fits" colleges={match} color="bg-emerald-100 text-emerald-700 border-emerald-200" />
        <CollegeSection title="Safety" description="Very likely admits you'd love" colleges={safety} color="bg-blue-100 text-blue-700 border-blue-200" />
      </div>
    </motion.div>
  );
}

function CollegeSection({ title, description, colleges, color }: { title: string, description: string, colleges: College[], color: string }) {
  if (colleges.length === 0) return null;
  
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-3">
          <span>{title}</span>
          <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>{colleges.length} schools</span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="space-y-3">
        {colleges.map((college, idx) => (
          <CollegeCard key={idx} college={college} />
        ))}
      </div>
    </section>
  );
}

function CollegeCard({ college }: { college: College }) {
  const [expanded, setExpanded] = useState(false);
  const hasDeepDive = !!college.deepDive;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div 
        className={`p-4 ${hasDeepDive ? 'cursor-pointer' : ''} flex justify-between items-start`}
        onClick={() => hasDeepDive && setExpanded(!expanded)}
      >
        <div className="pr-4">
          <h4 className="font-bold text-slate-900 text-lg">{college.name}</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{college.reason}</p>
        </div>
        {hasDeepDive && (
          <button className="p-1 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full flex-shrink-0 mt-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {expanded && hasDeepDive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50"
          >
            <div className="p-4 space-y-4 text-sm">
              {college.deepDive?.whyFit && (
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Why You Fit</h5>
                  <p className="text-slate-700">{college.deepDive.whyFit}</p>
                </div>
              )}
              {college.deepDive?.stats && (
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Your Stats</h5>
                  <p className="text-slate-700">{college.deepDive.stats}</p>
                </div>
              )}
              {college.deepDive?.hook && (
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Your Hook</h5>
                  <p className="text-slate-700">{college.deepDive.hook}</p>
                </div>
              )}
              {college.deepDive?.essayAngle && (
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Essay Angle</h5>
                  <p className="text-slate-700">{college.deepDive.essayAngle}</p>
                </div>
              )}
              {college.deepDive?.strengthen && (
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Strengthen</h5>
                  <p className="text-slate-700">{college.deepDive.strengthen}</p>
                </div>
              )}
              {college.deepDive?.insiderNote && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1">Insider Note</h5>
                  <p className="text-amber-800">{college.deepDive.insiderNote}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
