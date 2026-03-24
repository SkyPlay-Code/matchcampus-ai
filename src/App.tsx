import React, { useState, useEffect } from 'react';
import { Chat, Message } from './components/Chat';
import { Results } from './components/Results';
import { parseCollegeList, College } from './utils/parser';
import { auth, db, signIn, logOut, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { LogIn, LogOut, GraduationCap, Menu } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

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
            const lastSession = snapshot.docs[0].data();
            if (lastSession.conversationHistory) {
              setMessages(lastSession.conversationHistory);
            }
            if (lastSession.collegeList && lastSession.collegeList.length > 0) {
              setColleges(lastSession.collegeList);
              setShowResults(true);
            }
          }
          setHasLoadedSession(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'sessions');
        }
      }
    });
    
    return () => unsubscribe();
  }, [hasLoadedSession]);

  const handleRecommendationReady = (text: string) => {
    const parsedColleges = parseCollegeList(text);
    if (parsedColleges.length > 0) {
      setColleges(parsedColleges);
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

    if (!currentUser) return;

    setIsSaving(true);
    try {
      const profileSummaryMatch = messages[messages.length - 1].content.match(/SECTION 1 — YOUR PROFILE SUMMARY\n([\s\S]*?)(?=\nSECTION 2)/);
      const profileSummary = profileSummaryMatch ? profileSummaryMatch[1].trim() : '';
      
      const nextStepsMatch = messages[messages.length - 1].content.match(/SECTION 4 — NEXT STEPS\n([\s\S]*?)$/);
      const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim().split('\n').filter(s => s.trim()) : [];

      await addDoc(collection(db, 'sessions'), {
        userId: currentUser.uid,
        conversationHistory: messages,
        profileSummary,
        collegeList: colleges,
        nextSteps,
        createdAt: serverTimestamp()
      });
      
      alert('List saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    } finally {
      setIsSaving(false);
    }
  };

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
          {colleges.length > 0 && (
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
        <div className={`flex-1 transition-all duration-300 ${showResults ? 'md:mr-[480px]' : ''}`}>
          <Chat 
            messages={messages} 
            setMessages={setMessages} 
            onRecommendationReady={handleRecommendationReady} 
          />
        </div>

        <AnimatePresence>
          {showResults && (
            <Results 
              colleges={colleges} 
              onSave={handleSave} 
              isSaving={isSaving} 
              onClose={() => setShowResults(false)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
