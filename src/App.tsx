/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Upload, 
  Camera, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2, 
  Monitor, 
  Loader2, 
  LogIn, 
  LogOut, 
  History, 
  User as UserIcon, 
  Maximize2, 
  Minimize2,
  Copy,
  Trash2,
  Plus,
  Sparkles,
  Zap,
  Leaf,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ImageIcon,
  MessageSquare,
  Send,
  Play,
  Timer,
  Compass,
  Briefcase,
  ArrowUpRight,
  Lock,
  X,
  Layers,
  FileText,
  Sliders as SlidersIcon,
  CheckSquare,
  BarChart3,
  Globe,
  Gauge,
  LayoutGrid,
  Users,
  Workflow,
  HelpCircle,
  Save,
  BookOpen,
  UserCheck,
  Target
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FocusMode } from './components/FocusMode';
import { CreditInfoModal } from './components/CreditInfoModal';
import { GoalTracker } from './components/GoalTracker';
import { AdvisorySuite } from './components/AdvisorySuite';
import { SmartEnvironmentHub } from './components/SmartEnvironmentHub';
import { MarketplaceLeads } from './components/MarketplaceLeads';
import { FeedbackModal } from './components/FeedbackModal';
import { StudyProfileManager } from './components/StudyProfileManager';
import { StudyTaskManager } from './components/StudyTaskManager';
import { generateGeminiContent, generateFallbackAnalysis } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, FirebaseUser, Timestamp, handleFirestoreError, OperationType, FirestoreErrorInfo, subscribeQuotaExceeded } from './firebase';
import { doc, setDoc, collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';

import { LandingPage } from './components/LandingPage';
import { UpgradePage } from './components/UpgradePage';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { ClientProject, WorkspaceAnnotation, WorkspaceAnalysis, StudyProfile, StudyTask } from './types';

// Error Boundary Component
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  props: Props;
  constructor(props: Props) {
    super(props);
    this.props = props;
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("ErrorBoundary caught an error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-stone-50 p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-stone-100">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 font-medium">We encountered an error. Please try refreshing the page.</p>
            <pre className="text-xs bg-gray-100 p-4 rounded-xl overflow-auto text-left max-h-40">
              {this.state.error?.message}
            </pre>
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors">
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}



// Default Prepopulated Client Projects
const defaultWorkspaceProjects: ClientProject[] = [
  {
    id: 'creative-studio-hub',
    clientName: 'Creative Studio Hub',
    projectName: 'Focus Pod Calibration',
    workspaceType: 'Creative Studio',
    dimensions: '24m x 12m Space',
    notes: 'Prioritizing light optimization and lumbar alignment. Afternoon optical glare from East windows.',
    scores: {
      ergonomics: 88,
      spatialEfficiency: 92,
      visualHarmony: 84,
      focusCalibration: 80,
      productivityIndex: 86
    },
    beforeImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
    afterImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'executive-strategy-suite',
    clientName: 'Executive Strategy Suite',
    projectName: 'Home Workspace Setup',
    workspaceType: 'Developer Lab',
    dimensions: '5.5m x 4m Suite',
    notes: 'Monitor parallax strain reported (needs monitor riser 12cm higher). Acoustic insulation calibrated.',
    scores: {
      ergonomics: 62,
      spatialEfficiency: 70,
      visualHarmony: 58,
      focusCalibration: 65,
      productivityIndex: 64
    },
    beforeImageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=1200',
    afterImageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1200',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ 
    usageCount?: number; 
    isPremium?: boolean; 
    tier?: 'free' | 'pro' | 'elite' | 'corporate';
    credits?: number;
    creditsLastReset?: any;
    trialEndsAt?: any;
    hasInfiniteCredits?: boolean;
    unlockedPersonalization?: string[];
    unlockedAdvisory?: boolean;
    academicContext?: any;
    examCalendar?: any[];
  } | null>(null);

  // Advanced Project state management
  const [projects, setProjects] = useState<ClientProject[]>(defaultWorkspaceProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>('creative-studio-hub');
  const [activeTab, setActiveTab] = useState<'analyzer' | 'leads'>('analyzer');
  const [projectSubTab, setProjectSubTab] = useState<'roster' | 'brief'>('roster');
  const [evolutionSubTab, setEvolutionSubTab] = useState<'metrics' | 'advisor'>('metrics');
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  
  // Create Project inputs
  const [newClientName, setNewClientName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState('Creative Studio');
  const [newDimensions, setNewDimensions] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Report Builder state management
  const [reportSkin, setReportSkin] = useState<'minimal' | 'bauhaus' | 'tech'>('minimal');
  const [customReportNotes, setCustomReportNotes] = useState(
    'Recommendations focus primarily on biomechanical muscle stress reduction, circadian temperature adjustments, and cable safety integration.'
  );

  useEffect(() => {
    // Check if user is the main user and log their access for debugging payment issues
    if (user?.email === 'urfaceismylife@gmail.com') {
      console.log("Welcome back, Lead Architect. App state initialized.");
    }
  }, [user]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isWideMode, setIsWideMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingTip, setLoadingTip] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [sendingChat, setSendingChat] = useState(false);
  const [analysisPlants, setAnalysisPlants] = useState<any[]>([]);
  const [spaceDetails, setSpaceDetails] = useState({
    deskDimensions: '',
    lighting: '',
    chairType: '',
    comfortNeeds: ''
  });

  // Study Space Profiles state
  const [studyProfiles, setStudyProfiles] = useState<StudyProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [analyzerWorkspaceView, setAnalyzerWorkspaceView] = useState<'scanner' | 'environment' | 'tasks'>('scanner');
  const [rightSidebarTab, setRightSidebarTab] = useState<'tasks' | 'environment' | 'chat' | 'history'>('tasks');
  const [historyProfileFilter, setHistoryProfileFilter] = useState<string>('all');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([
    "Calibrate lighting color temperature to 4200K",
    "Adjust monitor height +5cm to eye horizon",
    "Set 20-20-20 eye strain relief timer",
    "Clear desk cable clutter around mouse pad"
  ]);

  const isElite = userProfile?.tier === 'corporate' || userProfile?.tier === 'elite' || userProfile?.hasInfiniteCredits || false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(false);
  const hasCheckedDailyResetRef = useRef(false);
  const hasInitializedUserDocRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeQuotaExceeded((exceeded) => {
      if (exceeded) {
        setFirestoreQuotaExceeded(true);
      }
    });
    return () => unsub();
  }, []);

  const [envBrightness, setEnvBrightness] = useState<number>(70);
  const [envColorTemp, setEnvColorTemp] = useState<number>(4000);

  const getAppAmbientOverlayStyle = () => {
    let rgb = '254, 240, 138'; // natural soft yellow
    if (envColorTemp < 3200) {
      rgb = '251, 146, 60'; // Candlelight / warm sunset
    } else if (envColorTemp < 4500) {
      rgb = '253, 186, 116'; // soft light orange warm
    } else if (envColorTemp < 5500) {
      rgb = '254, 240, 138'; // natural white yellow
    } else {
      rgb = '186, 230, 253'; // cool daylight blue
    }
    const opacity = (envBrightness / 100) * 0.045;
    return {
      backgroundColor: `rgba(${rgb}, ${opacity})`,
      transition: 'background-color 0.8s ease'
    };
  };

  // Check for successful checkout on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const plan = urlParams.get('plan') as 'pro' | 'elite' | null;
    if (sessionId && user && isAuthReady) {
      handleUpgrade(plan || 'pro');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, isAuthReady]);

  const tips = [
    "Spatial Intelligence: Screen height alignment reduces spine stress by up to 22%.",
    "Circadian Index: Color temperature tuning controls melatonin release dynamics.",
    "Acoustic Masking: Consistent broadband sound shields primary focus channels from spikes.",
    "Biophilic Density: Presence of micro-plants yields an 8% increase in task concentration speed.",
    "Clutter Saturation: Cognitive processing cycles improve when spatial fields of view contain zero wire hazards."
  ];

  useEffect(() => {
    if (analyzing) {
      const interval = setInterval(() => {
        setLoadingTip((prev) => (prev + 1) % tips.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [analyzing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        hasCheckedDailyResetRef.current = false;
        hasInitializedUserDocRef.current = false;
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to user profile for usage and premium status
        const unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);

            // CRITICAL: Ignore local snapshots with pending writes to prevent recursive write feedback loops
            if (docSnap.metadata.hasPendingWrites) {
              return;
            }

            // Daily Reset Logic - only evaluate once per session on server-confirmed timestamp
            if (!hasCheckedDailyResetRef.current && data.creditsLastReset?.toDate) {
              hasCheckedDailyResetRef.current = true;
              const now = new Date();
              const lastReset = data.creditsLastReset.toDate();
              const isDifferentDay = now.toDateString() !== lastReset.toDateString();
              
              if (isDifferentDay) {
                const currentTier = data.tier || '';
                const limit = currentTier === 'corporate' ? 5000 : currentTier === 'elite' ? 1000 : currentTier === 'pro' ? 500 : 100;
                let newCredits = limit;
                if (data.credits !== undefined) {
                  const lastResetDate = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
                  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const msDiff = nowDate.getTime() - lastResetDate.getTime();
                  const daysPassed = Math.max(1, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
                  newCredits = data.credits + (limit - 250) * daysPassed;
                }
                try {
                  await setDoc(userRef, {
                    credits: newCredits,
                    creditsLastReset: serverTimestamp()
                  }, { merge: true });
                } catch (err: any) {
                  const msg = err?.message || String(err);
                  if (msg.includes('Quota') || msg.includes('resource-exhausted')) {
                    setFirestoreQuotaExceeded(true);
                  }
                }
              }
            }
          } else {
            // First time user: initialize document once if not yet created
            if (!hasInitializedUserDocRef.current) {
              hasInitializedUserDocRef.current = true;
              try {
                await setDoc(userRef, {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  credits: 100,
                  creditsLastReset: serverTimestamp(),
                  updatedAt: serverTimestamp()
                }, { merge: true });
              } catch (err: any) {
                const msg = err?.message || String(err);
                if (msg.includes('Quota') || msg.includes('resource-exhausted')) {
                  setFirestoreQuotaExceeded(true);
                }
              }
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        });
        
        return () => unsubProfile();
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAuthReady && userProfile) {
      // Free users get no history
      if (!userProfile.isPremium) {
        setHistory([]);
        return;
      }

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      // Pro gets 5, Elite gets unlimited
      const isElite = userProfile.tier === 'elite';
      const q = isElite 
        ? query(analysesRef, orderBy('createdAt', 'desc'))
        : query(analysesRef, orderBy('createdAt', 'desc'), limit(5));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(items);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/analyses`);
      });
      
      return () => unsubscribe();
    } else {
      setHistory([]);
    }
  }, [user, isAuthReady, userProfile]);

  // Read synced projects
  useEffect(() => {
    if (user && isAuthReady && userProfile) {
      const projectsRef = collection(db, 'users', user.uid, 'projects');
      const q = query(projectsRef, orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClientProject[];
          setProjects(items);
        } else {
          // If Firestore is empty, initialize default projects into local memory but don't force write yet to avoid write loops
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/projects`);
      });
      return () => unsub();
    }
  }, [user, isAuthReady, userProfile]);

  // Read synced study profiles
  useEffect(() => {
    if (user && isAuthReady) {
      const profilesRef = collection(db, 'users', user.uid, 'study_profiles');
      const q = query(profilesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StudyProfile[];
          setStudyProfiles(items);
          setActiveProfileId(prev => {
            if (prev && items.some(p => p.id === prev)) {
              return prev;
            }
            const def = items.find(p => p.isDefault) || items[0];
            return def ? def.id : '';
          });
        } else {
          // Provide default initial study profile in local state - avoid writing to Firestore on empty snapshot
          const defaultProfile: StudyProfile = {
            id: 'default-study-desk',
            name: 'Primary Study Desk',
            studyFocus: 'Computer Science & Academic Prep',
            deskDimensions: '140cm x 70cm Dual Display',
            lighting: '4200K Natural White, Indirect Task Lamp',
            chairType: 'Ergonomic Mesh Chair with Lumbar Support',
            comfortNeeds: 'Reduce cervical neck strain and screen glare',
            targetDailyFocusHours: 4,
            isDefault: true
          };
          setStudyProfiles([defaultProfile]);
          setActiveProfileId('default-study-desk');
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/study_profiles`);
      });

      return () => unsubscribe();
    } else {
      setStudyProfiles([]);
      setActiveProfileId('');
    }
  }, [user, isAuthReady]);

  const activeProfile = studyProfiles.find(p => p.id === activeProfileId) || null;

  // Sync spaceDetails from active profile when profile changes
  useEffect(() => {
    if (activeProfile) {
      setSpaceDetails(prev => ({
        deskDimensions: activeProfile.deskDimensions || prev.deskDimensions,
        lighting: activeProfile.lighting || prev.lighting,
        chairType: activeProfile.chairType || prev.chairType,
        comfortNeeds: activeProfile.comfortNeeds || prev.comfortNeeds
      }));
    }
  }, [activeProfileId]);

  const handleCreateProfile = async (profileData: Omit<StudyProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'study_profiles'), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveProfileId(docRef.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/study_profiles`);
      throw e;
    }
  };

  const handleUpdateProfile = async (profileId: string, updates: Partial<StudyProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'study_profiles', profileId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/study_profiles/${profileId}`);
      throw e;
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'study_profiles', profileId));
      if (activeProfileId === profileId) {
        const remaining = studyProfiles.filter(p => p.id !== profileId);
        if (remaining.length > 0) {
          setActiveProfileId(remaining[0].id);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/study_profiles/${profileId}`);
      throw e;
    }
  };

  const handleSaveSpaceDetailsToProfile = async () => {
    if (!activeProfileId || !user) return;
    try {
      await handleUpdateProfile(activeProfileId, {
        deskDimensions: spaceDetails.deskDimensions,
        lighting: spaceDetails.lighting,
        chairType: spaceDetails.chairType,
        comfortNeeds: spaceDetails.comfortNeeds
      });
      setError("Preferences saved to active study profile!");
      setTimeout(() => setError(null), 3000);
    } catch (e) {
      setError("Failed to save preferences to profile.");
    }
  };

  const savedAnalysisCountByProfile = history.reduce<Record<string, number>>((acc, item) => {
    const pId = item.profileId || 'legacy';
    acc[pId] = (acc[pId] || 0) + 1;
    return acc;
  }, {});

  const login = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Failed to sign in with Google.");
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setImage(null);
      setResult(null);
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.log("Sign out/Switch cancelled or failed", err);
    }
  };

  const handleUnlockPersonalization = async (field: string, label: string) => {
    if (!user) return;
    const credits = userProfile?.credits || 0;
    if (credits < 10) {
      setShowUpgrade(true);
      setError(`Not enough credits to unlock text calibration option ${label}. Personalization features cost 10 credits each.`);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const unlocked = userProfile?.unlockedPersonalization || [];
      await setDoc(userRef, {
        credits: Math.max(0, credits - 10),
        unlockedPersonalization: [...unlocked, field]
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
    } catch (err) {
      setError("Failed to unlock personalization field.");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newProjectName.trim()) return;

    const limitReached = !userProfile?.isPremium && projects.filter(p => !p.id.startsWith('sample-')).length >= 1;
    if (limitReached) {
      setShowUpgrade(true);
      setError("Standard practice is limited to 1 custom project. Upgrade to load unlimited multi-client portfolios.");
      return;
    }

    const newProject: ClientProject = {
      id: 'project-' + Date.now(),
      clientName: newClientName,
      projectName: newProjectName,
      workspaceType: newWorkspaceType,
      dimensions: newDimensions,
      notes: newNotes,
      scores: {
        ergonomics: 70,
        spatialEfficiency: 70,
        visualHarmony: 70,
        focusCalibration: 70,
        productivityIndex: 70
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'projects'), {
          ...newProject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed saving project to Firestore:", err);
      }
    }

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setNewClientName('');
    setNewProjectName('');
    setNewDimensions('');
    setNewNotes('');
    setActiveTab('leads');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
      } catch (err) {
        console.error("Failed to delete project from Firestore:", err);
      }
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Computer vision scan algorithm
  const analyzeSpace = async () => {
    if (!image || !user) return;

    const isPremium = userProfile?.isPremium || false;
    const credits = userProfile?.credits || 0;

    if (!isPremium && credits < 10) {
      setShowUpgrade(true);
      setError("Not enough credits for analysis. Visual space scans cost 10 credits.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setGeneratedImage(null);

    try {
      const isDeskUnlocked = isElite || userProfile?.unlockedPersonalization?.includes('deskDimensions');
      const isLightingUnlocked = isElite || userProfile?.unlockedPersonalization?.includes('lighting');
      const isChairUnlocked = isElite || userProfile?.unlockedPersonalization?.includes('chairType');
      const isComfortUnlocked = isElite || userProfile?.unlockedPersonalization?.includes('comfortNeeds');

      const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];

      const personalizationPrompt = `
        The client is organizing a "${activeProj.workspaceType}" project named "${activeProj.projectName}".
        Specifications context provided:
        - Desk Scale Dimensions: ${isDeskUnlocked ? (spaceDetails.deskDimensions || '120x60 Standard') : 'Locked'}
        - Atmospheric Lighting Sources: ${isLightingUnlocked ? (spaceDetails.lighting || 'Ambient sunlight') : 'Locked'}
        - Mechanical Chair Type: ${isChairUnlocked ? (spaceDetails.chairType || 'Office Ergonomic') : 'Locked'}
        - Spatial Client Support Needs: ${isComfortUnlocked ? (spaceDetails.comfortNeeds || 'Reduce focal fatigue') : 'Locked'}
      `;

      const plantPrompt = isElite ? `
        SPECIAL DIRECTIVE (Elite Studio Plan): Suggest exactly 3 beautiful, easy-to-care-for plants suited to this observed workspace lighting environment to filter toxins.
        Provide a clean JSON blocks between [PLANTS_JSON] and [/PLANTS_JSON] tags like:
        [PLANTS_JSON] [{"name": "Snake Plant", "why": "Flourishes in indirect east daylight", "care": "Water every 14 days"}] [/PLANTS_JSON]
      ` : '';

      const prompt = `
        You are a seasoned senior workspace strategist, ergonomic architectural analyst, and workspace transform expert.
        Analyze the client spatial photograph uploaded. Evaluated space uses: ${activeProj.workspaceType}.
        
        ${personalizationPrompt}
        ${plantPrompt}

        Formulate your spatial strategy document using these precise headers using human-literal markers:
        ## Executive Spatial Calibre
        Provide a 1-sentence analytical overview of the desk setup.
        
        ## Ergonomic Biomechanical Strain Diagnostics
        Deconstruct monitor heights, parallax, typing angles, shoulder elevations, and lumbar seating configurations seen in the photo.
        
        ## Atmospheric Circadian & Sound Shielding
        Detail lumens quality, shadows, and thermal ambient wellness.
        
        ## Structured Structural Layout Action Items
        Provide exact visual coordinates and steps to realign furniture.

        Also, provide computer-vision calculated scores based on this image. Render them at the VERY END in a strict JSON array block with this syntax:
        [SCORES_JSON] {"ergonomics": 78, "spatialEfficiency": 85, "visualHarmony": 72, "focusCalibration": 68, "productivityIndex": 80} [/SCORES_JSON]. Make sure to fill in actual values.
      `;

      const contents = [
        { role: "user", parts: [{ inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } }, { text: prompt }] }
      ];

      const analysisResult = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents,
        fallbackText: generateFallbackAnalysis(activeProj.workspaceType)
      });

      setResult(analysisResult);

      // Parse botanical data
      if (isElite) {
        const pRegex = /\[PLANTS_JSON\]([\s\S]*?)\[\/PLANTS_JSON\]/;
        const match = analysisResult.match(pRegex);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1].trim());
            setAnalysisPlants(parsed);
          } catch (e) {
            console.error("Failed to parse plants json:", e);
          }
        }
      }

      // Parse visual scores
      const sRegex = /\[SCORES_JSON\]([\s\S]*?)\[\/SCORES_JSON\]/;
      const scoreMatch = analysisResult.match(sRegex);
      let calculatedScores = activeProj.scores;
      if (scoreMatch && scoreMatch[1]) {
        try {
          calculatedScores = JSON.parse(scoreMatch[1].trim());
        } catch (e) {
          console.error("Failed to parse scores json:", e);
        }
      }

      // Update project metrics in-memory
      const updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            scores: calculatedScores,
            beforeImageUrl: image,
            updatedAt: new Date()
          };
        }
        return p;
      });
      setProjects(updatedProjects);

      // Save to Firebase synced projects collection
      if (user) {
        const qRef = doc(db, 'users', user.uid, 'projects', activeProjectId);
        await setDoc(qRef, {
          scores: calculatedScores,
          beforeImageUrl: image,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.log('Bypassing quick project snapshot write...'));
      }

      // Deduct standard analysis credit cost (10 credits)
      const userRef = doc(db, 'users', user.uid);
      if (!isPremium && !userProfile?.hasInfiniteCredits) {
        await setDoc(userRef, {
          credits: Math.max(0, credits - 10),
          usageCount: (userProfile?.usageCount || 0) + 1
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      } else {
        await setDoc(userRef, {
          usageCount: (userProfile?.usageCount || 0) + 1
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }

      // Write transaction history
      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      if (isPremium && !isElite && history.length >= 5) {
        try {
          const oldestItem = history[history.length - 1];
          if (oldestItem?.id) {
            await deleteDoc(doc(db, 'users', user.uid, 'analyses', oldestItem.id));
          }
        } catch (err) {
          console.error("Cleanup history error:", err);
        }
      }

      await addDoc(analysesRef, {
        uid: user.uid,
        projectId: activeProjectId,
        profileId: activeProfileId || null,
        result: analysisResult,
        imageUrl: image,
        generatedImageUrl: null,
        plants: isElite ? analysisPlants : [],
        spaceDetails: spaceDetails,
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/analyses`));

      if (analysisResult) {
        const dynamicTasks: string[] = [];
        if (spaceDetails.deskDimensions) {
          dynamicTasks.push(`Align workspace equipment to ${spaceDetails.deskDimensions}`);
        }
        if (spaceDetails.lighting) {
          dynamicTasks.push(`Calibrate study lamp: ${spaceDetails.lighting}`);
        }
        dynamicTasks.push("Conduct 30-min ergonomic study posture review");
        setSuggestedTasks(prev => Array.from(new Set([...dynamicTasks, ...prev])).slice(0, 6));
      }

    } catch (err: any) {
      console.error("Space analysis failure:", err);
      setError(err.message || "Failed to parse high-fidelity vision alignment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateImprovedVisual = async (mode: '2d' | '3d') => {
    if (!user) return;
    
    setGeneratingImage(true);
    setGeneratedImage(null);

    const credits = userProfile?.credits || 0;
    const cost = mode === '2d' ? 50 : 1000;

    if (!userProfile?.hasInfiniteCredits && credits < cost) {
      setShowUpgrade(true);
      setError(`Not enough credits. ${mode === '2d' ? '2D Layout Redesign' : '3D Realistic Render'} costs ${cost} credits.`);
      setGeneratingImage(false);
      return;
    }

    try {
      const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];
      const contextText = result || `A highly optimized modern desk workspace designed specifically for a ${activeProj?.workspaceType || 'Executive Desk'} themed project named "${activeProj?.projectName || 'Primary Comfort Lounge'}".`;

      const promptGenRequest = mode === '2d' 
        ? `A high-fidelity minimalist 2D architectural layout blueprint schema of an optimized academic/creative desk workspace setup. ${contextText}. Overhead drawing style, clean black lines, perfectly organized desk posture geometry, labeled zones, no human figures, professional studio design blueprint, highly legible.`
        : `A breathtaking, ultra-realistic premium 3D interior design rendering of an elite optimized workspace desk. Organized according to: ${contextText}. Warm studio lighting, wooden accents, sleek dual screen setup, warm ambient acoustics, high-end corporate portfolio quality, beautiful cinematic rendering, zero visual noise or characters.`;

      let b64: string | null = null;

      try {
        const genText = await generateGeminiContent({
          model: "gemini-3.1-flash-image",
          contents: { parts: [{ text: promptGenRequest }] },
          fallbackText: ""
        });
        if (genText && genText.startsWith("data:image")) {
          b64 = genText;
        }
      } catch (genErr) {
        console.warn("Gemini image API generation failed, using Pollinations engine:", genErr);
      }

      if (!b64) {
        const seed = Math.floor(Math.random() * 100000);
        b64 = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptGenRequest)}?width=1280&height=720&nologo=true&seed=${seed}`;
      }

      setGeneratedImage(b64);

      // Update in-memory active project
      const updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          if (mode === '2d') {
            return { ...p, beforeImageUrl: b64 };
          } else {
            return { ...p, afterImageUrl: b64 };
          }
        }
        return p;
      });
      setProjects(updatedProjects);

      // Save visual model update back to Firestore project
      try {
        const qRef = doc(db, 'users', user.uid, 'projects', activeProjectId);
        if (mode === '2d') {
          await setDoc(qRef, { beforeImageUrl: b64, updatedAt: serverTimestamp() }, { merge: true });
        } else {
          await setDoc(qRef, { afterImageUrl: b64, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (pErr) {
        console.log("No synced project document path initialized yet.");
      }

      // Save to analysis collection for reference
      try {
        const analysesRef = collection(db, 'users', user.uid, 'analyses');
        const q = query(analysesRef, orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0];
          await updateDoc(latestDoc.ref, {
            generatedImageUrl: b64
          });
        }
      } catch (aErr) {
        console.log("Analysis doc update deferred:", aErr);
      }

      // Deduct credits for image generation
      if (!userProfile?.hasInfiniteCredits) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          credits: Math.max(0, credits - cost)
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      
    } catch (err: any) {
      console.error("Visual generation logic failure:", err);
      setError(`Failed to construct ${mode === '2d' ? '2D' : '3D'} layout rendering.`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'elite') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const trialDuration = 7 * 24 * 60 * 60 * 1000;
      const trialEndsAt = new Date(Date.now() + trialDuration);
      
      await setDoc(userRef, { 
        isPremium: true,
        tier: plan,
        trialStartedAt: serverTimestamp(),
        trialEndsAt: Timestamp.fromDate(trialEndsAt)
      }, { merge: true });
      setShowUpgrade(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !result || sendingChat) return;

    const isPremium = userProfile?.isPremium || false;
    const credits = userProfile?.credits || 0;

    if (!isPremium && !userProfile?.hasInfiniteCredits && credits < 1) {
      setShowUpgrade(true);
      setError("Not enough credits for chat follow up. Ask responses cost 1 credit each.");
      return;
    }

    // Deduct 1 credit for follow up chat message
    if (!userProfile?.hasInfiniteCredits && !isPremium) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        credits: Math.max(0, credits - 1)
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setSendingChat(true);

    try {
      const contents = [
        ...chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: `You are an environmental and ergonomics advisor. You previously analyzed a workspace and provided these recommendations: ${result}. The user is now asking a follow-up question. Answer in a helpful, personal tone ("I have...", "I noticed...").\n\nUser Question: ${userMessage}` }] }
      ];

      const text = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents,
        fallbackText: `Based on your setup analysis, I recommend optimizing desk clearance and screen distance to address your question ("${userMessage}"). Elevate your primary monitor plane and ensure light sources are offset to eliminate eye strain.`
      });
      
      setChatMessages(prev => [...prev, { role: 'model', text }]);

    } catch (err: any) {
      console.error("Chat error:", err);
      setError("Failed to generate chat advice.");
    } finally {
      setSendingChat(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'analyses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/analyses/${id}`);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const selectFileAndScan = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setActiveTab('analyzer');
      };
      reader.readAsDataURL(file);
    }
  };

  // Find active project details
  const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];

  if (!isAuthReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#faf9f6] overflow-y-auto">
        <Loader2 className="w-12 h-12 text-stone-900 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={login} error={error} />;
  }

  if (showAdmin && user) {
    return <AdminSettingsModal user={user} profile={userProfile} onClose={() => setShowAdmin(false)} />;
  }

  if (showUpgrade) {
    return <UpgradePage user={user} onBack={() => setShowUpgrade(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-3 sm:p-6 transition-all duration-500 pb-20 pt-16 selection:bg-stone-200">
      {/* Dynamic Ambient Color Temperature / Lux Simulation */}
      <div className="fixed inset-0 pointer-events-none z-[190] mix-blend-multiply" style={getAppAmbientOverlayStyle()} />
      
      <AnimatePresence>
        {showFocusMode && (
          <FocusMode 
            onClose={() => setShowFocusMode(false)} 
            userProfile={userProfile}
            onUpgrade={() => setShowUpgrade(true)}
          />
        )}
        {showCreditInfo && (
          <CreditInfoModal 
            onClose={() => setShowCreditInfo(false)}
            credits={userProfile?.credits || 0}
            onUpgrade={() => setShowUpgrade(true)}
          />
        )}
        {showFeedback && (
          <FeedbackModal 
            user={user}
            userProfile={userProfile}
            onClose={() => setShowFeedback(false)}
          />
        )}
        {showProfileManager && (
          <StudyProfileManager
            profiles={studyProfiles}
            activeProfileId={activeProfileId}
            onSelectProfile={(id) => setActiveProfileId(id)}
            onCreateProfile={handleCreateProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            onClose={() => setShowProfileManager(false)}
            savedAnalysisCountByProfile={savedAnalysisCountByProfile}
          />
        )}
      </AnimatePresence>

      <div className={`${isWideMode ? 'max-w-full' : 'max-w-7xl'} mx-auto space-y-6 sm:space-y-10 relative`}>
        {/* Professional Header Navigation Console */}
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-stone-200/80 pb-6 gap-6 relative z-[110]">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-stone-900 p-2.5 rounded-2xl shadow-xl shadow-stone-950/10">
                <Layers className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black uppercase tracking-[0.2em] text-stone-900">Mesa</span>
                <span className="text-[10px] block font-semibold text-stone-400 -mt-1 uppercase tracking-[0.12em]">Workspace</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-sm ml-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-4 h-4 rounded-full border border-stone-900" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-stone-600" />
                )}
                <span className="text-xs font-black text-stone-800 uppercase tracking-wide">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={() => setShowProfileManager(true)}
                className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200"
                title="Manage Profiles"
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setActiveTab('analyzer');
                  setAnalyzerWorkspaceView('tasks');
                }}
                className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200"
                title="Study Tasks"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              {!userProfile?.isPremium && (
                <button 
                  onClick={() => setShowUpgrade(true)}
                  className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:animate-pulse"
                >
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </button>
              )}
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-stone-900" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Core Horizontal Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-2 rounded-2xl border border-stone-200/80 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs md:text-sm uppercase tracking-wider transition-all ${
                activeTab === 'analyzer' ? 'bg-white text-stone-950 shadow-md font-black' : 'text-stone-500 hover:text-stone-950'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              Workspace Intelligence
            </button>
            <button
              onClick={() => {
                if (!userProfile?.isPremium && (userProfile?.tier === 'free' || !userProfile?.tier)) {
                  setShowUpgrade(true);
                } else {
                  setActiveTab('leads');
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs md:text-sm uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'leads' ? 'bg-white text-stone-950 shadow-md font-black' : 'text-stone-500 hover:text-stone-950'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              MESA Business Suite
              {(!userProfile?.isPremium || userProfile?.tier === 'free') && (
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
              )}
            </button>
          </div>
          
          {/* Metadata system toggles, administrative rules, credit counters */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Profile Manager trigger */}
            <button 
              onClick={() => setShowProfileManager(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-800 rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-200 transition-all shadow-sm group cursor-pointer"
              title="Manage Study Profiles and Preferences"
            >
              <UserCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline font-black text-[11px] truncate max-w-[130px]">
                {activeProfile?.name || 'Profiles'}
              </span>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                {studyProfiles.length}
              </span>
            </button>

            {/* Quick Study Tasks trigger */}
            <button 
              onClick={() => {
                setActiveTab('analyzer');
                setAnalyzerWorkspaceView('tasks');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                activeTab === 'analyzer' && analyzerWorkspaceView === 'tasks'
                  ? 'bg-blue-600 text-white shadow-blue-600/20 font-black'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-200'
              }`}
              title="Study Goals & Task Management"
            >
              <CheckSquare className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-black">Tasks</span>
            </button>

            <button 
              onClick={() => setShowCreditInfo(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border hover:border-amber-500/85 hover:bg-amber-500/5 transition-all text-left cursor-pointer group ${
                userProfile?.isPremium ? 'bg-amber-500/10 border-amber-500/30' : 'bg-stone-100 border-stone-250'
              }`}
              title="Click to view full operational Credit ledger"
            >
              <Zap className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${userProfile?.isPremium ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${userProfile?.isPremium ? 'text-amber-800' : 'text-stone-600'}`}>
                {userProfile?.isPremium 
                  ? (userProfile.trialEndsAt 
                    ? `Elite Trial (${Math.max(0, Math.ceil((userProfile.trialEndsAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left) · ${userProfile?.credits || 0} Cr` 
                    : `Elite Studio Plan · ${userProfile?.credits || 0} Cr`)
                  : `${userProfile?.credits || 0} Calibre Credits`}
              </span>
              <HelpCircle className="w-3 h-3 text-stone-400 group-hover:text-amber-600 transition-colors shrink-0" />
            </button>

            {!userProfile?.isPremium && (
              <button 
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-200 pulse cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade
              </button>
            )}

            <button 
              onClick={() => setShowFocusMode(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              <Timer className="w-4 h-4 text-emerald-400" />
              Focus
            </button>

            <button 
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
              title="Submit feedback (emailed to the developer)"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              Feedback
            </button>

            <button 
              onClick={() => handleSignOut()}
              className="p-2 text-stone-400 hover:text-stone-950 transition-colors cursor-pointer"
              title="Switch Practitioner / Logout Account"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-stone-200 mx-1" />

            <button 
              onClick={() => setShowAdmin(!showAdmin)} 
              className="p-2 text-stone-400 hover:text-stone-950 transition-colors"
              title="Admin Controls"
            >
              <ShieldCheck className="w-5.5 h-5.5" />
            </button>
          </div>
        </header>

        {/* Firestore Quota Notice Banner */}
        {firestoreQuotaExceeded && (
          <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-amber-200/80 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Firestore Free Daily Write Quota Reached</p>
                <p className="text-xs text-amber-700/90 mt-0.5">
                  The daily write quota for this free-tier database has been exceeded. Free quota resets daily at midnight PST. The app is currently operating in offline local-cache mode.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0543706445/firestore/databases/ai-studio-63e1c589-f71f-422b-83ff-fa845c7bc62f/data?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Upgrade Quota in Firebase</span>
              </a>
              <button 
                onClick={() => setFirestoreQuotaExceeded(false)} 
                className="p-1 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center justify-between border border-red-100 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="font-bold text-xs sm:text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Master Tab Content Routing Router */}
        <div>
          {/* Atmosphere and client projects rendering blocks consolidated under MESA Business Suite Tab */}

          {/* TAB 3: SPATIAL COMPUTER-VISION DIAGNOSTIC SCANNERS & STUDY SPACE WORKSPACE */}
          {activeTab === 'analyzer' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Study Space Profile & Environment Management Bar */}
              <div className="bg-white p-5 rounded-[2.5rem] border border-stone-200/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-700 rounded-2xl border border-amber-500/20 shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Active Study Profile:</span>
                      <div className="relative inline-block">
                        <select
                          value={activeProfileId}
                          onChange={(e) => setActiveProfileId(e.target.value)}
                          className="bg-[#faf9f6] text-stone-900 font-black text-xs uppercase tracking-wide px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          {studyProfiles.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.studyFocus || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                      {activeProfile?.isDefault && (
                        <span className="text-[9px] font-bold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span><strong>Focus:</strong> {activeProfile?.studyFocus || 'Academic Preparation'}</span>
                      <span>•</span>
                      <span><strong>Desk:</strong> {activeProfile?.deskDimensions || 'Standard Desk'}</span>
                      <span>•</span>
                      <span><strong>Lighting:</strong> {activeProfile?.lighting || '4000K Natural'}</span>
                      <span>•</span>
                      <span><strong>Target:</strong> {activeProfile?.targetDailyFocusHours || 4}h/day</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleSaveSpaceDetailsToProfile}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black uppercase tracking-wider rounded-xl transition-colors border border-stone-250 cursor-pointer"
                    title="Save current Personalization Suite inputs to active profile"
                  >
                    <Save className="w-3.5 h-3.5 text-stone-600" />
                    Save Specs to Profile
                  </button>
                  <button
                    onClick={() => setShowProfileManager(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    Manage Profiles ({studyProfiles.length})
                  </button>
                </div>
              </div>

              {/* Analyzer Workspace Sub-Modes */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100 p-2 rounded-2xl border border-stone-200/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setAnalyzerWorkspaceView('scanner')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      analyzerWorkspaceView === 'scanner'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-amber-600" />
                    Workspace Vision Scanner
                  </button>

                  <button
                    onClick={() => setAnalyzerWorkspaceView('environment')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      analyzerWorkspaceView === 'environment'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    Smart Environmental Feedback
                  </button>

                  <button
                    onClick={() => setAnalyzerWorkspaceView('tasks')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      analyzerWorkspaceView === 'tasks'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    Study Tasks & Goals
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 text-[11px] text-stone-400 font-semibold">
                  <span>Profile:</span>
                  <span className="font-bold text-stone-700">{activeProfile?.name || 'Primary'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {analyzerWorkspaceView === 'environment' && (
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md">
                      <SmartEnvironmentHub 
                        userProfile={userProfile}
                        onUpgrade={() => setShowUpgrade(true)}
                        onLightingChange={(brightness, colorTemp) => {
                          setEnvBrightness(brightness);
                          setEnvColorTemp(colorTemp);
                        }}
                      />
                    </div>
                  )}

                  {analyzerWorkspaceView === 'tasks' && (
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md">
                      <StudyTaskManager
                        user={user}
                        activeProfile={activeProfile}
                        profiles={studyProfiles}
                        suggestedTasks={suggestedTasks}
                      />
                    </div>
                  )}

                  {analyzerWorkspaceView === 'scanner' && (
                    <>
                      <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-8">
                  <div className="border-b pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">Spatial Scanner Inspector</h2>
                      <p className="text-stone-400 text-xs">Run physical alignment algorithms against client photorealistic space drafts using Google Gemini vision models.</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono bg-stone-100 text-stone-600 px-3.5 py-1.5 rounded-lg border">VISION V3.5</span>
                  </div>

                  {/* Alignment scanning upload zone with crosshairs */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase text-stone-400 block tracking-widest">Target Image Allocation</span>
                    
                    <div 
                      onClick={selectFileAndScan}
                      className="border-4 border-dashed border-stone-200 hover:border-stone-400 transition-all rounded-[2.5rem] bg-stone-50 p-10 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] relative group"
                    >
                      {/* Decorative Alignment Target Lines (Computer vision feel) */}
                      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-stone-300 group-hover:border-stone-500 transition-colors" />
                      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-stone-300 group-hover:border-stone-500 transition-colors" />
                      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-stone-300 group-hover:border-stone-500 transition-colors" />
                      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-stone-300 group-hover:border-stone-500 transition-colors" />
                      
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {image ? (
                        <div className="space-y-4 w-full">
                          <img src={image} alt="Target Upload" className="max-h-60 mx-auto rounded-2xl object-cover shadow-md referrerPolicy='no-referrer'" />
                          <p className="text-xs text-[#78716c] font-black uppercase tracking-widest mt-2">{activeProj.clientName} Snapshot Configured</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white p-5 rounded-3xl inline-block shadow-sm">
                            <Upload className="w-8 h-8 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-900 uppercase tracking-widest">Assign Workspace Photo & Drop Here</p>
                            <p className="text-stone-400 text-xs font-semibold max-w-sm mx-auto mt-1">Accepts standard landscape desk base images. Ensure monitor elevations are fully visible.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personalization specifications grid block */}
                  <div className="bg-stone-50/60 p-8 rounded-[2.5rem] border border-stone-200/80 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-4">
                      <div>
                        <h4 className="text-sm font-black uppercase text-stone-900 tracking-tight flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-505 text-amber-550 text-amber-500 animate-pulse" />
                          Personalization Suite
                        </h4>
                        <p className="text-[11px] text-[#7c726a] font-semibold mt-0.5">Define physical dimensions and microclimate parameters to fine-tune AI recommendations.</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-800 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider self-start sm:self-center">
                        10 Credits Per Calibration Option
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Desk Type input option */}
                      <div className="transition-all duration-300">
                        {(!isElite && !userProfile?.unlockedPersonalization?.includes('deskDimensions')) ? (
                          <div className="bg-white hover:bg-stone-100/50 p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between h-56 transition-all group relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-[2rem] group-hover:opacity-10 transition-opacity">
                              <SlidersIcon className="w-16 h-16 text-amber-800" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-stone-100 rounded-xl text-stone-600">
                                  <SlidersIcon className="w-4 h-4" />
                                </div>
                                <h5 className="text-xs font-black uppercase text-stone-900 tracking-wider">Desk Scale Calibration</h5>
                              </div>
                              <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                                Unlocks screen surface boundary tuning, monitor parallax indices, and ideal arm-rest heights.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleUnlockPersonalization('deskDimensions', 'Desk Dimensions')}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all mt-4 border-b-2 border-stone-950"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Unlock Calibration (10 Cr)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-[2rem] border border-amber-200 shadow-md h-56 flex flex-col justify-between hover:border-amber-400 transition-colors text-left">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                    <SlidersIcon className="w-4 h-4" />
                                  </div>
                                  <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider">Desk Scale Calibration</h5>
                                </div>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase">Active</span>
                              </div>
                              <p className="text-[11px] text-[#7c726a] font-semibold leading-relaxed">
                                Set custom desk width and depth to configure precise physical boundaries.
                              </p>
                            </div>
                            <div className="space-y-1 mt-auto">
                              <label className="text-[9px] font-black uppercase text-amber-600 block pl-1">Desk Dimensions</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 140cm x 80cm Custom Oak"
                                className="w-full bg-[#fdfdfc] border border-stone-200/80 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono shadow-sm"
                                value={spaceDetails.deskDimensions}
                                onChange={(e) => setSpaceDetails({...spaceDetails, deskDimensions: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lighting Input option */}
                      <div className="transition-all duration-300">
                        {(!isElite && !userProfile?.unlockedPersonalization?.includes('lighting')) ? (
                          <div className="bg-white hover:bg-stone-100/50 p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between h-56 transition-all group relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-[2rem] group-hover:opacity-10 transition-opacity">
                              <Lightbulb className="w-16 h-16 text-amber-800" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-stone-100 rounded-xl text-stone-600">
                                  <Lightbulb className="w-4 h-4" />
                                </div>
                                <h5 className="text-xs font-black uppercase text-stone-900 tracking-wider">Atmospheric Light Calibration</h5>
                              </div>
                              <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                                Unlocks screen glare mitigation metrics, daylight flux alignments, and recommended smart light temp placement.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleUnlockPersonalization('lighting', 'Lighting Sources')}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all mt-4 border-b-2 border-stone-950"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Unlock Calibration (10 Cr)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-[2rem] border border-amber-200 shadow-md h-56 flex flex-col justify-between hover:border-amber-400 transition-colors text-left">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                    <Lightbulb className="w-4 h-4" />
                                  </div>
                                  <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider">Atmospheric Lighting</h5>
                                </div>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase">Active</span>
                              </div>
                              <p className="text-[11px] text-[#7c726a] font-semibold leading-relaxed">
                                Specify light types or window placement to calibrate screen glare.
                              </p>
                            </div>
                            <div className="space-y-1 mt-auto">
                              <label className="text-[9px] font-black uppercase text-amber-600 block pl-1">Light Sources</label>
                              <input 
                                type="text" 
                                placeholder="e.g. West window, LED monitor lightbar"
                                className="w-full bg-[#fdfdfc] border border-stone-200/80 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono shadow-sm"
                                value={spaceDetails.lighting}
                                onChange={(e) => setSpaceDetails({...spaceDetails, lighting: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Seating baseline option */}
                      <div className="transition-all duration-300">
                        {(!isElite && !userProfile?.unlockedPersonalization?.includes('chairType')) ? (
                          <div className="bg-white hover:bg-stone-100/50 p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between h-56 transition-all group relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-[2rem] group-hover:opacity-10 transition-opacity">
                              <Layers className="w-16 h-16 text-amber-800" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-stone-100 rounded-xl text-stone-600">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <h5 className="text-xs font-black uppercase text-stone-900 tracking-wider">Seating Mechanical Class</h5>
                              </div>
                              <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                                Unlocks tailored lumbar advice, posture alignment steps, and pressure distribution parameters.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleUnlockPersonalization('chairType', 'Chair Type')}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all mt-4 border-b-2 border-stone-950"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Unlock Calibration (10 Cr)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-[2rem] border border-amber-200 shadow-md h-56 flex flex-col justify-between hover:border-amber-400 transition-colors text-left">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider">Seating Ergonomic Class</h5>
                                </div>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase">Active</span>
                              </div>
                              <p className="text-[11px] text-[#7c726a] font-semibold leading-relaxed">
                                Detail your active chair mechanics to calibrate lumbar spine curves.
                              </p>
                            </div>
                            <div className="space-y-1 mt-auto">
                              <label className="text-[9px] font-black uppercase text-amber-600 block pl-1">Active Seating Model</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Herman Miller Aeron Size B, mesh seat"
                                className="w-full bg-[#fdfdfc] border border-stone-200/80 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono shadow-sm"
                                value={spaceDetails.chairType}
                                onChange={(e) => setSpaceDetails({...spaceDetails, chairType: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Workspace Pain/Comfort Option */}
                      <div className="transition-all duration-300">
                        {(!isElite && !userProfile?.unlockedPersonalization?.includes('comfortNeeds')) ? (
                          <div className="bg-white hover:bg-stone-100/50 p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between h-56 transition-all group relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-[2rem] group-hover:opacity-10 transition-opacity">
                              <ShieldCheck className="w-16 h-16 text-amber-800" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-stone-100 rounded-xl text-stone-600">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <h5 className="text-xs font-black uppercase text-stone-900 tracking-wider">Ergonomic Strain Targeting</h5>
                              </div>
                              <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                                Unlocks target diagnostics specifically for relief of custom physical fatigue and eye strain.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleUnlockPersonalization('comfortNeeds', 'Comfort Needs')}
                              className="w-full py-3 bg-stone-900 hover:bg-stone-850 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all mt-4 border-b-2 border-stone-950"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Unlock Calibration (10 Cr)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-[2rem] border border-amber-200 shadow-md h-56 flex flex-col justify-between hover:border-amber-400 transition-colors text-left">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider">Ergonomic Strain Targeting</h5>
                                </div>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase">Active</span>
                              </div>
                              <p className="text-[11px] text-[#7c726a] font-semibold leading-relaxed">
                                List persistent comfort challenges to receive tailored workspace relief recipes.
                              </p>
                            </div>
                            <div className="space-y-1 mt-auto">
                              <label className="text-[9px] font-black uppercase text-amber-600 block pl-1">Key Physical Concerns</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Lower back fatigue, daily optical strain"
                                className="w-full bg-[#fdfdfc] border border-stone-200/80 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono shadow-sm"
                                value={spaceDetails.comfortNeeds}
                                onChange={(e) => setSpaceDetails({...spaceDetails, comfortNeeds: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Operational Launch buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center bg-stone-100 p-6 rounded-[2rem] border">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[10px] uppercase text-stone-400 font-bold block">Analysis calculation price</span>
                      <p className="text-xs font-black text-stone-700">10 Calibre Credits deducted on triggering</p>
                    </div>

                    <button 
                      onClick={analyzeSpace}
                      disabled={analyzing || !image}
                      className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-stone-900 border-b-4 border-stone-800 text-stone-100 font-extrabold text-xs uppercase tracking-widest rounded-2xl hover:bg-stone-800 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          Processing scan...
                        </>
                      ) : (
                        <>
                          <Monitor className="w-4 h-4 text-emerald-400 group-hover:rotate-6 transition-transform" />
                          Trigger Computer-Vision scan
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Display outputs if ready */}
                {result && (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                      <h3 className="font-black text-base uppercase flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                        Advisor Recommendations Document
                      </h3>

                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => generateImprovedVisual('2d')}
                          disabled={generatingImage}
                          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg"
                        >
                          {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 inline-block -mt-1 mr-1" />}
                          2D Layout Redesign (50 Cr)
                        </button>
                        <button 
                          onClick={() => generateImprovedVisual('3d')}
                          disabled={generatingImage}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-lg"
                        >
                          {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 inline-block -mt-1 mr-1" />}
                          3D Interactive Render (1000 Cr)
                        </button>
                        <button 
                          onClick={copyToClipboard}
                          className="p-2 border rounded-xl hover:bg-stone-100"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-stone-500" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl border">
                      <p className="text-xs text-stone-500 uppercase font-bold tracking-widest">Active room tags evaluated: {activeProj.workspaceType}</p>
                    </div>

                    <div className="markdown-body text-xs sm:text-sm prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>

                    {/* Elite plants Suggestions */}
                    {(analysisPlants.length > 0 || userProfile?.tier !== 'elite') && (
                      <div className="border bg-[#f0fdf4] border-emerald-100 rounded-[2rem] p-6 space-y-4 relative overflow-hidden mt-6">
                        {userProfile?.tier !== 'elite' && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                            <Lock className="w-6 h-6 text-emerald-700 bg-emerald-150 p-1 rounded-md mb-2" />
                            <h4 className="text-xs font-black uppercase text-emerald-950">Biophilic Plant Suggester Gated</h4>
                            <p className="text-[10px] text-emerald-700 max-w-xs mb-3">Elite licensed consultants get indoor vegetation options mapped automatically with measured sunlight profiles.</p>
                            <button onClick={() => setShowUpgrade(true)} className="px-3 py-1.5 bg-emerald-700 text-white font-black uppercase text-[9px] rounded-lg hover:bg-emerald-800">
                              Unlock with Elite
                            </button>
                          </div>
                        )}

                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-lg inline-block">Botanical Intelligence</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {analysisPlants.length > 0 ? analysisPlants.map((plant, pi) => (
                            <div key={pi} className="bg-white p-4 rounded-2xl border space-y-2 shadow-sm text-left">
                              <h5 className="font-black text-emerald-800 text-sm uppercase">{plant.name}</h5>
                              <p className="text-stone-500 text-xs">{plant.why}</p>
                              <div className="pt-2 border-t text-[10px] font-bold text-stone-400">
                                CARE: <span className="text-emerald-700 block font-normal text-xs">{plant.care}</span>
                              </div>
                            </div>
                          )) : [1,2,3].map(e => (
                            <div key={e} className="bg-white/40 h-28 rounded-2xl animate-pulse border" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                    </>
                  )}
              </div>

              {/* Interactive Multi-Tab Workspace Assistant Column */}
              <div className="space-y-4">
                {/* Right Column Tab Switcher */}
                <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80">
                  <button
                    onClick={() => setRightSidebarTab('tasks')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightSidebarTab === 'tasks'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tasks</span>
                  </button>

                  <button
                    onClick={() => setRightSidebarTab('chat')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightSidebarTab === 'chat'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={() => setRightSidebarTab('environment')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightSidebarTab === 'environment'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Sensors</span>
                  </button>

                  <button
                    onClick={() => setRightSidebarTab('history')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightSidebarTab === 'history'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Scans</span>
                  </button>
                </div>

                {/* TAB: TASKS */}
                {rightSidebarTab === 'tasks' && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/80 shadow-md">
                    <StudyTaskManager
                      compact={true}
                      user={user}
                      activeProfile={activeProfile}
                      profiles={studyProfiles}
                      suggestedTasks={suggestedTasks}
                    />
                  </div>
                )}

                {/* TAB: CHAT */}
                {rightSidebarTab === 'chat' && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/80 shadow-md flex flex-col space-y-4 h-[560px]">
                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">PRACTITIONER LIVE CHAT FEED (1 CR)</span>
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-2 min-h-[250px] leading-relaxed text-xs">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-16 text-stone-300">
                          <MessageSquare className="w-10 h-10 mx-auto opacity-30 mb-2" />
                          <p className="italic">Inquire about posture adjustments, lighting lux presets, or soundproofing baselines.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-semibold ${msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-stone-100 text-stone-800 rounded-tl-none border'}`}>
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          </div>
                        ))
                      )}
                      {sendingChat && (
                        <div className="flex justify-start">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleChat} className="flex gap-2">
                      <input 
                        type="text" 
                        disabled={!result || sendingChat}
                        placeholder={!result ? "Run spatial scan first..." : "Inquire about layout details..."}
                        className="flex-grow bg-[#faf9f6] border text-xs px-3 py-3 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={sendingChat || !chatInput.trim() || !result}
                        className="p-3 bg-stone-900 font-bold hover:bg-stone-800 text-white rounded-xl text-xs uppercase cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB: SENSORS & ENVIRONMENT */}
                {rightSidebarTab === 'environment' && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/80 shadow-md">
                    <SmartEnvironmentHub 
                      userProfile={userProfile}
                      onUpgrade={() => setShowUpgrade(true)}
                      onLightingChange={(brightness, colorTemp) => {
                        setEnvBrightness(brightness);
                        setEnvColorTemp(colorTemp);
                      }}
                    />
                  </div>
                )}

                {/* TAB: SCANS & HISTORY */}
                {rightSidebarTab === 'history' && (
                  <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-stone-500">Diagnostic Database</h4>
                        <span className="text-[10px] text-stone-400 font-medium">Saved Study Space Analyses</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-stone-400">{history.length} ITEMS</span>
                    </div>

                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {history.map((it) => (
                        <div key={it.id} className="p-3.5 bg-stone-50 rounded-2xl border flex flex-col gap-2 group hover:border-[#fbbf24] transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <button 
                              onClick={() => {
                                setResult(it.result);
                                setImage(it.imageUrl || null);
                                setGeneratedImage(it.generatedImageUrl || null);
                                if (it.plants) setAnalysisPlants(it.plants);
                                if (it.spaceDetails) setSpaceDetails(it.spaceDetails);
                                if (it.profileId && studyProfiles.some(p => p.id === it.profileId)) {
                                  setActiveProfileId(it.profileId);
                                }
                                setAnalyzerWorkspaceView('scanner');
                              }}
                              className="text-left flex-grow text-xs font-semibold text-stone-700 hover:text-stone-950 line-clamp-2"
                            >
                              {it.result && it.result.substring(0, 75)}...
                            </button>
                            <button 
                              onClick={() => deleteAnalysis(it.id)} 
                              className="text-stone-300 hover:text-[#f43f5e] opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                              title="Delete scan record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-stone-400 font-bold uppercase pt-1 border-t border-stone-200/60">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {studyProfiles.find(p => p.id === it.profileId)?.name || 'Study Profile'}
                            </span>
                            <span>
                              {it.createdAt ? new Date(it.createdAt?.toDate ? it.createdAt.toDate() : it.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p className="text-center text-[10px] text-stone-400 italic py-6">Database empty. Run a spatial scan to store study space recommendations.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* TAB 4: LEAD GENERATION & PROFESSIONAL MARKETPLACE */}
          {activeTab === 'leads' && (
            <MarketplaceLeads 
              userProfile={userProfile}
              onUpgrade={() => setShowUpgrade(true)}
              activeProjectScores={activeProj?.scores}
              onSwitchToOverview={() => setActiveTab('leads')}
              projects={projects}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              projectSubTab={projectSubTab}
              setProjectSubTab={setProjectSubTab}
              newClientName={newClientName}
              setNewClientName={setNewClientName}
              newProjectName={newProjectName}
              setNewProjectName={setNewProjectName}
              newWorkspaceType={newWorkspaceType}
              setNewWorkspaceType={setNewWorkspaceType}
              newDimensions={newDimensions}
              setNewDimensions={setNewDimensions}
              newNotes={newNotes}
              setNewNotes={setNewNotes}
              handleCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              activeProj={activeProj}
              generatingImage={generatingImage}
              generateImprovedVisual={generateImprovedVisual}
              reportSkin={reportSkin}
              setReportSkin={setReportSkin}
              customReportNotes={customReportNotes}
              setCustomReportNotes={setCustomReportNotes}
              analysisPlants={analysisPlants}
              isElite={isElite}
              evolutionSubTab={evolutionSubTab}
              setEvolutionSubTab={setEvolutionSubTab}
            />
          )}


          {/* Workspace evolution rendering consolidated inside MESA Business Suite tab */}
        </div>

        {/* Global Footer brand line */}
        <footer className="border-t pt-10 pb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-stone-400 font-medium">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-stone-900" />
            <span className="text-stone-900 font-black uppercase tracking-[0.2em]">Mesa Workspace</span>
          </div>
          
          <div className="flex items-center gap-8 text-stone-400 uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-stone-950 transition-colors">Workspace Intelligence protocol</a>
            <a href="#" className="hover:text-stone-950 transition-colors uppercase font-bold italic tracking-wider">Surface is my life</a>
          </div>
          
          <p>© 2026 Mesa Spatial Intelligence, Inc. Structured client workflows compile.</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
