import React, { useState, useEffect } from 'react';
import { Chat, Message } from './components/Chat';
import { Results } from './components/Results';
import { parseResults, ParsedResults } from './utils/parser';
import { auth, db, signIn, logOut, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { LogIn, LogOut, GraduationCap, Menu, Sparkles, RefreshCw, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [results, setResults] = useState<ParsedResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Load last session if available
      if (currentUser && !hasLoadedSession) {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(
            sessionsRef, 
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const lastSessionDoc = snapshot.docs[0];
            const lastSession = lastSessionDoc.data();
            
            setSessionId(lastSessionDoc.id);
            
            if (lastSession.conversationHistory) {
              setMessages(lastSession.conversationHistory);
            }
            
            if (lastSession.collegeList && lastSession.collegeList.length > 0) {
              setResults({
                story: lastSession.studentStory || '',
                colleges: lastSession.collegeList,
                roadmap: lastSession.roadmap || [],
                rightNow: lastSession.rightNow || []
              });
              if (lastSession.checklistState) {
                setChecklistState(lastSession.checklistState);
              }
              setShowWelcomeBack(true);
            }
          }
          setHasLoadedSession(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'sessions');
        }
      } else if (!currentUser) {
        setHasLoadedSession(true);
      }
    });
    
    return () => unsubscribe();
  }, [hasLoadedSession]);

  const handleRecommendationReady = (text: string) => {
    const parsed = parseResults(text);
    if (parsed) {
      setResults(parsed);
      setShowResults(true);
    }
  };

  const handleSave = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        currentUser = await signIn();
      } catch (error) {
        return; // User cancelled sign in
      }
    }

    if (!currentUser || !results) return;

    setIsSaving(true);
    try {
      if (sessionId) {
        // Update existing session
        await updateDoc(doc(db, 'sessions', sessionId), {
          conversationHistory: messages,
          studentStory: results.story,
          collegeList: results.colleges,
          roadmap: results.roadmap,
          rightNow: results.rightNow,
          checklistState,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new session
        const docRef = await addDoc(collection(db, 'sessions'), {
          userId: currentUser.uid,
          conversationHistory: messages,
          studentStory: results.story,
          collegeList: results.colleges,
          roadmap: results.roadmap,
          rightNow: results.rightNow,
          checklistState,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSessionId(docRef.id);
      }
      
      alert('List saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAskAbout = (schoolName: string) => {
    const prompt = `Can you give me a deep dive strategy for ${schoolName}?`;
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setShowResults(false);
  };

  const handleReviewList = () => {
    setShowWelcomeBack(false);
    setShowResults(true);
  };

  const handleStartFresh = () => {
    setMessages([]);
    setResults(null);
    setShowResults(false);
    setSessionId(null);
    setChecklistState({});
    setShowWelcomeBack(false);
  };

  const handleUpdateProfile = () => {
    setShowWelcomeBack(false);
    setMessages(prev => [...prev, { role: 'user', content: "I'd like to update my profile. Here's what changed..." }]);
    setShowResults(false);
  };

  if (showWelcomeBack && user) {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome back, {user.displayName?.split(' ')[0]}!</h1>
          <p className="text-slate-400 mb-8">We saved your college strategy from last time. What would you like to do?</p>
          
          <div className="space-y-3">
            <button 
              onClick={handleReviewList}
              className="w-full flex items-center justify-center space-x-3 bg-amber-500 hover:bg-amber-600 text-white py-4 px-6 rounded-xl font-medium transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              <span>Review My List</span>
            </button>
            <button 
              onClick={handleUpdateProfile}
              className="w-full flex items-center justify-center space-x-3 bg-slate-800 hover:bg-slate-700 text-white py-4 px-6 rounded-xl font-medium transition-colors border border-slate-700"
            >
              <Edit3 className="w-5 h-5 text-slate-400" />
              <span>Update My Profile</span>
            </button>
            <button 
              onClick={handleStartFresh}
              className="w-full flex items-center justify-center space-x-3 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white py-4 px-6 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Start Fresh</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white z-20 relative">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-slate-900 leading-tight">CampusMatch</h1>
            <p className="text-xs text-slate-500 font-medium">Your AI college counselor</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {results && (
            <button 
              onClick={() => setShowResults(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.displayName}</span>
              <button 
                onClick={logOut}
                className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        <div className={`flex-1 transition-all duration-300 ${showResults ? 'md:mr-[60%]' : ''}`}>
          <Chat 
            messages={messages} 
            setMessages={setMessages} 
            onRecommendationReady={handleRecommendationReady} 
          />
        </div>

        <AnimatePresence>
          {showResults && results && (
            <Results 
              results={results} 
              onSave={handleSave} 
              isSaving={isSaving} 
              onClose={() => setShowResults(false)}
              onAskAbout={handleAskAbout}
              checklistState={checklistState}
              onToggleChecklist={handleToggleChecklist}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
