import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  User, 
  Briefcase, 
  Compass, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  Sliders, 
  Building,
  ChevronRight,
  ShieldCheck,
  Send,
  Users,
  Inbox,
  Workflow,
  ArrowRight,
  Loader2,
  Lock,
  Globe,
  Award,
  Lightbulb,
  Plus,
  FileText,
  Copy,
  Layers,
  Zap,
  Trash2,
  X,
  UserPlus,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { SmartEnvironmentHub } from './SmartEnvironmentHub';
import { ClientProject } from '../types';
import { GoalTracker } from './GoalTracker';
import { AdvisorySuite } from './AdvisorySuite';

// Multi-Specialty Expert Catalog Registry
export interface ExpertSpecialist {
  id: string;
  name: string;
  email?: string;
  firm: string;
  role: string;
  avatar: string;
  specialty: 'ergonomics' | 'minimalist' | 'creator-studios' | 'acoustic' | 'biophilic';
  specialtyLabel: string;
  location: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  tags: string[];
  skills: string[];
  bio: string;
}

export interface LeadInquiry {
  id: string;
  clientName: string;
  clientEmail: string;
  workspaceType: string;
  goals: string[];
  budgetTier: 'minimal' | 'premium' | 'enterprise';
  painPoints: string[];
  notes?: string;
  status: 'new' | 'reviewed' | 'qualified' | 'proposal_sent' | 'archived';
  createdAt: any;
  scoreSnapshot?: {
    ergonomics: number;
    spatialEfficiency: number;
    visualHarmony: number;
    focusCalibration: number;
    productivityIndex: number;
  };
}

interface MarketplaceLeadsProps {
  userProfile?: any;
  onUpgrade?: () => void;
  activeProjectScores?: {
    ergonomics: number;
    spatialEfficiency: number;
    visualHarmony: number;
    focusCalibration: number;
    productivityIndex: number;
  };
  onSwitchToOverview?: () => void;
  onAddLogMessage?: (msg: string) => void;
  projects?: ClientProject[];
  onSelectProject?: (id: string) => void;
  activeProjectId?: string | null;
  setActiveProjectId?: (id: string | null) => void;
  projectSubTab?: 'roster' | 'brief';
  setProjectSubTab?: (subTab: 'roster' | 'brief') => void;
  newClientName?: string;
  setNewClientName?: (val: string) => void;
  newProjectName?: string;
  setNewProjectName?: (val: string) => void;
  newWorkspaceType?: string;
  setNewWorkspaceType?: (val: string) => void;
  newDimensions?: string;
  setNewDimensions?: (val: string) => void;
  newNotes?: string;
  setNewNotes?: (val: string) => void;
  handleCreateProject?: (e: React.FormEvent) => void;
  onDeleteProject?: (id: string) => void;
  activeProj?: ClientProject | null;
  generatingImage?: boolean;
  generateImprovedVisual?: (mode: '2d' | '3d') => Promise<void>;
  reportSkin?: 'minimal' | 'bauhaus' | 'tech';
  setReportSkin?: (skin: 'minimal' | 'bauhaus' | 'tech') => void;
  customReportNotes?: string;
  setCustomReportNotes?: (val: string) => void;
  analysisPlants?: Array<{ name: string; why: string }>;
  isElite?: boolean;
  evolutionSubTab?: 'metrics' | 'advisor';
  setEvolutionSubTab?: (val: 'metrics' | 'advisor') => void;
}

export function MarketplaceLeads({ 
  userProfile, 
  onUpgrade, 
  activeProjectScores,
  onSwitchToOverview,
  onAddLogMessage,
  projects = [],
  onSelectProject,
  activeProjectId,
  setActiveProjectId,
  projectSubTab = 'roster',
  setProjectSubTab,
  newClientName = '',
  setNewClientName,
  newProjectName = '',
  setNewProjectName,
  newWorkspaceType = 'Creative Studio',
  setNewWorkspaceType,
  newDimensions = '',
  setNewDimensions,
  newNotes = '',
  setNewNotes,
  handleCreateProject,
  activeProj,
  generatingImage = false,
  generateImprovedVisual,
  reportSkin = 'minimal',
  setReportSkin,
  customReportNotes = '',
  setCustomReportNotes,
  analysisPlants = [],
  isElite = false,
  evolutionSubTab = 'metrics',
  setEvolutionSubTab,
  onDeleteProject
}: MarketplaceLeadsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'qualification' | 'contractor-leads' | 'atmosphere' | 'projects' | 'evolution'>('directory');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  
  // Lead submission form
  const [formName, setFormName] = useState(userProfile?.displayName || '');
  const [formEmail, setFormEmail] = useState(userProfile?.email || '');
  const [formWorkspaceType, setFormWorkspaceType] = useState('Creative Studio');
  const [formGoals, setFormGoals] = useState<string[]>([]);
  const [formPainPoints, setFormPainPoints] = useState<string[]>([]);
  const [formBudget, setFormBudget] = useState<'minimal' | 'premium' | 'enterprise'>('premium');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Specialists from Firestore
  const [specialists, setSpecialists] = useState<ExpertSpecialist[]>([]);
  const [isSpecialistsLoading, setIsSpecialistsLoading] = useState(true);
  const [showAddSpecialistModal, setShowAddSpecialistModal] = useState(false);

  // New Specialist / Colleague Form
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecEmail, setNewSpecEmail] = useState('');
  const [newSpecFirm, setNewSpecFirm] = useState('');
  const [newSpecRole, setNewSpecRole] = useState('');
  const [newSpecSpecialty, setNewSpecSpecialty] = useState<'ergonomics' | 'minimalist' | 'creator-studios' | 'acoustic' | 'biophilic'>('ergonomics');
  const [newSpecLocation, setNewSpecLocation] = useState('');
  const [newSpecHourlyRate, setNewSpecHourlyRate] = useState<number>(150);
  const [newSpecBio, setNewSpecBio] = useState('');
  const [newSpecSkills, setNewSpecSkills] = useState('');
  const [newSpecTags, setNewSpecTags] = useState('');
  const [newSpecAvatar, setNewSpecAvatar] = useState('');
  const [isSubmittingSpec, setIsSubmittingSpec] = useState(false);

  // Add Annotation Form
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<'ergonomics' | 'lighting' | 'acoustics' | 'spatial'>('ergonomics');
  const [annComment, setAnnComment] = useState('');
  const [showAddAnnotation, setShowAddAnnotation] = useState(false);

  // Add Inbound Inquiry Form (in Contractor Leads tab)
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadWorkspace, setNewLeadWorkspace] = useState('Developer Lab');
  const [newLeadBudget, setNewLeadBudget] = useState<'minimal' | 'premium' | 'enterprise'>('premium');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  
  // Practitioner's Leads Inbox list
  const [leads, setLeads] = useState<LeadInquiry[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadInquiry | null>(null);

  const user = auth.currentUser;

  // Track if user acts as a Professional/Practitioner
  const isPractitioner = userProfile?.tier === 'corporate' || userProfile?.tier === 'elite' || false;

  // Real-time listener for Specialists
  useEffect(() => {
    if (!user) {
      setIsSpecialistsLoading(false);
      return;
    }

    const specRef = collection(db, 'specialists');
    const q = query(specRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(specRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExpertSpecialist[];
      setSpecialists(items);
      setIsSpecialistsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'specialists');
      setIsSpecialistsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listener for incoming Leads
  useEffect(() => {
    if (!user) {
      setIsLeadsLoading(false);
      return;
    }

    const leadsRef = collection(db, 'consult_leads');
    const q = query(leadsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(leadsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeadInquiry[];
      setLeads(items);
      setIsLeadsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'consult_leads');
      setIsLeadsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Add Colleague Handler
  const handleAddSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    setIsSubmittingSpec(true);
    try {
      const payload = {
        name: newSpecName,
        email: newSpecEmail.trim() || 'colleague@designstudio.com',
        firm: newSpecFirm || 'Interior Design Studio',
        role: newSpecRole || 'Colleague / Design Partner',
        specialty: newSpecSpecialty,
        specialtyLabel: newSpecSpecialty === 'ergonomics' ? 'Ergonomics & Mechanics' 
                       : newSpecSpecialty === 'minimalist' ? 'Minimalist Architecture'
                       : newSpecSpecialty === 'acoustic' ? 'Acoustic Insulation'
                       : newSpecSpecialty === 'biophilic' ? 'Biophilic Systems'
                       : 'Spatial Design',
        location: newSpecLocation || 'Remote / Worldwide',
        rating: 5.0,
        completedJobs: 1,
        hourlyRate: Number(newSpecHourlyRate) || 150,
        tags: newSpecTags ? newSpecTags.split(',').map(t => t.trim()).filter(Boolean) : ['Colleague', 'Verified'],
        skills: newSpecSkills ? newSpecSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Spatial Audit'],
        bio: newSpecBio || 'Design colleague invited to collaborate on client spatial projects.',
        avatar: newSpecAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'specialists'), payload);

      setNewSpecName('');
      setNewSpecEmail('');
      setNewSpecFirm('');
      setNewSpecRole('');
      setNewSpecBio('');
      setNewSpecSkills('');
      setNewSpecTags('');
      setNewSpecAvatar('');
      setShowAddSpecialistModal(false);
      
      if (onAddLogMessage) {
        onAddLogMessage(`Project invite sent to ${payload.email} for colleague ${payload.name}.`);
      }
    } catch (err) {
      console.error("Error adding colleague:", err);
    } finally {
      setIsSubmittingSpec(false);
    }
  };

  const handleDeleteSpecialist = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'specialists', id));
    } catch (err) {
      console.error("Failed to delete specialist:", err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'consult_leads', id));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const handleAddInboundLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadEmail.trim()) return;

    setIsSubmittingLead(true);
    try {
      const payload: Omit<LeadInquiry, 'id'> = {
        clientName: newLeadName,
        clientEmail: newLeadEmail,
        workspaceType: newLeadWorkspace,
        goals: ['Ergonomics Alignment', 'Spatial Efficiency'],
        painPoints: ['Posture Strain'],
        budgetTier: newLeadBudget,
        notes: newLeadNotes,
        status: 'new',
        createdAt: serverTimestamp(),
        scoreSnapshot: activeProjectScores || {
          ergonomics: 70,
          spatialEfficiency: 70,
          visualHarmony: 70,
          focusCalibration: 70,
          productivityIndex: 70
        }
      };

      await addDoc(collection(db, 'consult_leads'), payload);

      setNewLeadName('');
      setNewLeadEmail('');
      setNewLeadNotes('');
      setShowAddLeadModal(false);
    } catch (err) {
      console.error("Failed adding lead:", err);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj || !annTitle.trim() || !user) return;

    try {
      const existing = activeProj.annotations || [];
      const newAnn = {
        id: 'ann-' + Date.now(),
        title: annTitle,
        category: annCategory,
        comment: annComment || 'Custom diagnostic annotation.'
      };

      const projRef = doc(db, 'users', user.uid, 'projects', activeProj.id);
      await updateDoc(projRef, {
        annotations: [...existing, newAnn]
      });

      setAnnTitle('');
      setAnnComment('');
      setShowAddAnnotation(false);
    } catch (err) {
      console.error("Failed adding annotation:", err);
    }
  };

  // Handle Form Submission: Client Requesting Consultation
  const handleRequestConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    setIsSubmittingForm(true);
    try {
      const payload: Omit<LeadInquiry, 'id'> = {
        clientName: formName,
        clientEmail: formEmail,
        workspaceType: formWorkspaceType,
        goals: formGoals,
        painPoints: formPainPoints,
        budgetTier: formBudget,
        notes: formNotes,
        status: 'new',
        createdAt: serverTimestamp(),
        scoreSnapshot: activeProjectScores || {
          ergonomics: 70,
          spatialEfficiency: 70,
          visualHarmony: 70,
          focusCalibration: 70,
          productivityIndex: 70
        }
      };

      // Add to global consult_leads collection
      await addDoc(collection(db, 'consult_leads'), payload);
      
      setIsSubmittingForm(false);
      setFormSuccess(true);
      if (onAddLogMessage) {
        onAddLogMessage(`Submitted professional spatial consultation request for "${formName}".`);
      }
    } catch (err) {
      console.error("Failed to add consult lead: ", err);
      setIsSubmittingForm(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadInquiry['status']) => {
    try {
      const leadRef = doc(db, 'consult_leads', leadId);
      await updateDoc(leadRef, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const toggleGoal = (goal: string) => {
    setFormGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const togglePain = (pain: string) => {
    setFormPainPoints(prev => prev.includes(pain) ? prev.filter(p => p !== pain) : [...prev, pain]);
  };

  const filteredExperts = selectedSpecialty === 'all' 
    ? specialists 
    : specialists.filter(e => e.specialty === selectedSpecialty);

  const getStatusBadge = (status: LeadInquiry['status']) => {
    const map = {
      new: 'bg-blue-100 text-blue-800 border-blue-205',
      reviewed: 'bg-amber-100 text-amber-800 border-amber-205',
      qualified: 'bg-emerald-100 text-emerald-800 border-emerald-250',
      proposal_sent: 'bg-indigo-100 text-indigo-800 border-indigo-250',
      archived: 'bg-stone-100 text-stone-600 border-stone-200'
    };
    return (
      <span className={`text-[10px] font-mono border font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${map[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Tab Header block */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-stone-950 bg-stone-950/10 px-3.5 py-1 rounded-lg">MESA Business Suite</span>
            <span className="text-[10px] font-mono font-black text-emerald-600 tracking-wider">ENTERPRISE CONSOLIDATION PROTOCOL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-2 flex items-center gap-2">
            <Layers className="w-7 h-7 text-stone-900 animate-spin-slow" />
            Mesa Business Suite
          </h2>
          <p className="text-stone-500 font-medium text-xs sm:text-sm max-w-2xl">
            Integrated architecture workspace for client projects management, custom performance briefings, lighting, audio simulation, and circadian evolution tracking.
          </p>
        </div>

        {/* Lead sub tab togglers */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-150 bg-stone-100 p-2 rounded-2xl border border-stone-200">
          <button 
            onClick={() => { setActiveSubTab('projects'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'projects' ? 'bg-stone-900 text-stone-50 shadow-sm font-black' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            Client Projects
          </button>

          <button 
            onClick={() => { setActiveSubTab('atmosphere'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'atmosphere' ? 'bg-stone-900 text-stone-50 shadow-sm font-black' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            Lighting & Acoustics
          </button>

          <button 
            onClick={() => { setActiveSubTab('evolution'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'evolution' ? 'bg-[#059669] text-white shadow-sm font-black' : 'text-emerald-700/80 hover:text-emerald-950 hover:bg-emerald-50/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            Workspace Evolution
          </button>

          <button 
            onClick={() => { setActiveSubTab('directory'); setFormSuccess(false); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'directory' ? 'bg-white text-stone-950 shadow-md border border-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Colleagues & Team
          </button>

          <button 
            onClick={() => { setActiveSubTab('qualification'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'qualification' ? 'bg-white text-stone-950 shadow-md border border-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Consultation Form
          </button>
          
          <button 
            onClick={() => { setActiveSubTab('contractor-leads'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'contractor-leads' ? 'bg-amber-500 text-stone-950 shadow-sm font-black' : 'text-stone-600 hover:text-stone-950 hover:bg-amber-100/30'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-stone-900" />
            {isPractitioner ? 'Practitioner Leads' : 'Practitioners'}
          </button>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeSubTab === 'directory' && (
        <div className="space-y-8">
          {/* Header Action Bar */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <h3 className="text-base font-black uppercase text-stone-900 tracking-tight">Team & Colleagues Directory</h3>
              <p className="text-stone-500 text-xs font-semibold">Manage registered colleagues, invite team members via email, and assign them to client design projects.</p>
            </div>
            <button
              onClick={() => setShowAddSpecialistModal(true)}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              Add Colleague & Invite
            </button>
          </div>

          {/* Specialties filter bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
            <span className="text-xs font-black text-stone-500 uppercase tracking-widest shrink-0 mr-2">Discipline:</span>
            {[
              { id: 'all', label: 'All Specialties' },
              { id: 'ergonomics', label: 'Ergonomics' },
              { id: 'minimalist', label: 'Minimalist Architecture' },
              { id: 'acoustic', label: 'Acoustics' },
              { id: 'biophilic', label: 'Biophilic Greenery' }
            ].map((spec) => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                  selectedSpecialty === spec.id 
                    ? 'bg-stone-900 text-white border-stone-950' 
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {spec.label}
              </button>
            ))}
          </div>

          {/* Colleagues grid list */}
          {isSpecialistsLoading ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading Colleagues Directory...</p>
            </div>
          ) : filteredExperts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredExperts.map((expert) => (
                <div 
                  key={expert.id} 
                  className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200/80 hover:border-amber-400 transition-all shadow-md group space-y-6 text-left relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img 
                          src={expert.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120'} 
                          alt={expert.name} 
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-stone-100" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full" title="Active Member" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                          {expert.role}
                        </span>
                        <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight mt-1">{expert.name}</h3>
                        <a 
                          href={`mailto:${expert.email || 'colleague@designstudio.com'}`}
                          className="text-stone-500 hover:text-amber-600 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-500" />
                          {expert.email || 'colleague@designstudio.com'}
                        </a>
                        <p className="text-stone-400 font-semibold text-[11px] flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {expert.firm} · {expert.location}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSpecialist(expert.id)}
                      title="Remove Colleague"
                      className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border-t border-b border-stone-100 py-3 flex items-center justify-between text-xs text-stone-600">
                    <span className="font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {expert.rating || 5.0} rating ({expert.completedJobs || 1} project audits)
                    </span>
                    <span className="font-black text-stone-900 font-mono">
                      ${expert.hourlyRate || 150} <span className="text-[10px] text-stone-400 uppercase font-bold">/ hour</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-stone-400">Colleague Profile</h4>
                    <p className="text-[#57534e] text-xs leading-relaxed font-semibold">
                      {expert.bio}
                    </p>
                  </div>

                  {expert.tags && expert.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {expert.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg font-bold border border-stone-200/60 uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (onAddLogMessage) {
                          onAddLogMessage(`Sent project invite email to ${expert.email || expert.name} for current workspace project.`);
                        }
                        alert(`Project Invite email dispatched to ${expert.email || expert.name}! They will receive access details shortly.`);
                      }}
                      className="py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                    >
                      <Mail className="w-4 h-4 text-stone-950" />
                      Send Invite
                    </button>

                    <button
                      onClick={() => {
                        setFormNotes(`Inquiry dedicated to collaborating with colleague ${expert.name} (${expert.email || expert.firm}). Specialty: ${expert.specialtyLabel || expert.specialty}.`);
                        setActiveSubTab('qualification');
                      }}
                      className="py-3 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-100 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 border-stone-950 cursor-pointer transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      Assign Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 bg-white border border-stone-200 rounded-[2.5rem] text-center space-y-4">
              <Users className="w-12 h-12 text-stone-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-stone-850 uppercase">No Colleagues Registered Yet</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">Add your colleagues or design team members via email to invite them to your studio projects.</p>
              </div>
              <button
                onClick={() => setShowAddSpecialistModal(true)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                + Add First Colleague
              </button>
            </div>
          )}
        </div>
      )}

      {/* Consultation Questionnaire Wizard Form */}
      {activeSubTab === 'qualification' && (
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-[2.5rem] border border-stone-200/80 shadow-xl text-left">
          <AnimatePresence mode="wait">
            {formSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-12"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-stone-900 uppercase">Consultation Registered!</h3>
                  <p className="text-stone-500 font-semibold text-sm max-w-md mx-auto">
                    Your multi-dimensional spatial diagnostic scores (Ergonomic, Lighting, Aesthetics) have been bundled and sent to our workspace consultant partner network.
                  </p>
                </div>
                <div className="bg-stone-50 p-6 rounded-2xl border flex flex-col items-center max-w-sm mx-auto space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-black">Qualification Level</span>
                  <span className="text-xs font-black text-stone-850 uppercase tracking-wide">High Intention Verified</span>
                  <p className="text-[11px] text-[#71717a] mt-1 italic font-mono">Our specialists respond via email within 4 hours.</p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => { setFormSuccess(false); setActiveSubTab('directory'); }}
                    className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl"
                  >
                    View Specialists Directory
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleRequestConsultation}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="border-b pb-4 space-y-1">
                  <h3 className="text-xl font-black uppercase text-stone-900">Spatial Diagnostic Questionnaire</h3>
                  <p className="text-stone-500 text-xs font-medium">Capture your spatial environment goals to receive a certified partner proposal.</p>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500">Practitioner Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Liam Sterling"
                      className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500">Contact Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. liam@sterling-consult.com"
                      className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500">Workspace Zoning Type</label>
                    <select
                      className="w-full bg-[#faf9f6]/90 border border-stone-200 rounded-xl px-4 py-3.5 text-xs font-bold"
                      value={formWorkspaceType}
                      onChange={(e) => setFormWorkspaceType(e.target.value)}
                    >
                      <option>Creative Studio</option>
                      <option>Developer Lab</option>
                      <option>Executive Desk</option>
                      <option>Architect Bay</option>
                      <option>Acoustic Focus Room</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500">Estimated Project Budget</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'minimal', label: 'Boutique' },
                        { id: 'premium', label: 'Premium' },
                        { id: 'enterprise', label: 'Enterprise' }
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setFormBudget(tier.id as any)}
                          className={`py-3 border text-[11px] font-black uppercase rounded-xl transition-all ${
                            formBudget === tier.id 
                              ? 'bg-stone-900 text-white border-stone-950 font-extrabold shadow-sm' 
                              : 'bg-[#faf9f6]/40 border-stone-200 text-stone-600 hover:border-stone-400'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multi selection goals */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 block pb-1">Primary Optimization Targets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'Ergonomics Realignment',
                      'Circadian Light Calibration',
                      'Acoustic Insulation',
                      'Zen Space Aesthetics',
                      'Cable Management',
                      'Storage Organization',
                      'Symmetrical Glare Defense',
                      'Biophilic Evaporation'
                    ].map((g, i) => {
                      const active = formGoals.includes(g);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleGoal(g)}
                          className={`p-3 border rounded-xl text-left text-[10px] font-semibold transition-all ${
                            active 
                              ? 'border-amber-500 bg-amber-500/10 text-amber-800 font-extrabold' 
                              : 'border-stone-200 bg-white hover:bg-stone-50 text-[#57534e]'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paint points */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 block pb-1">Biomechanical/Optical Challenges</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'Neck Parallax Strain',
                      'Lower Lumbar Fatigue',
                      'Late-Day Eyestrain',
                      'Visual Clutter',
                      'Background Echo',
                      'Poor Ambient Lux',
                      'Friction Movement',
                      'Cold Airflow Drafts'
                    ].map((p, i) => {
                      const active = formPainPoints.includes(p);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => togglePain(p)}
                          className={`p-3 border rounded-xl text-left text-[10px] font-semibold transition-all ${
                            active 
                              ? 'border-rose-300 bg-rose-500/10 text-rose-800 font-extrabold' 
                              : 'border-stone-200 bg-white hover:bg-stone-50 text-[#57534e]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional instructions */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 block">Workspace Spatial Specifications / Context</label>
                  <textarea
                    rows={4}
                    placeholder="Provide any spatial specifications, desk sizing, window exposures or active chair models to enhance qualification mechanics..."
                    className="w-full bg-[#faf9f6]/80 border border-stone-200/80 rounded-2xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                {/* Calibration Scores inclusion alert banner */}
                <div className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl flex items-center justify-between text-xs text-stone-500 leading-normal">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="font-semibold text-stone-600">
                      Your current active workspace scores <span className="text-stone-900 font-black">({activeProjectScores ? Object.values(activeProjectScores).reduce((a, b) => a + b, 0) / 5 : 70}% Index)</span> will be secure-synced to verify your audit diagnostics level.
                    </p>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="w-full py-4.5 bg-stone-900 hover:bg-stone-850 active:scale-95 text-stone-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl transition-all border-b-4 border-stone-950 disabled:opacity-50"
                >
                  {isSubmittingForm ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Send className="w-4 h-4 text-emerald-400" />
                  )}
                  Transmit Consultation Requirements
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Practitioner leads inbox tab */}
      {activeSubTab === 'contractor-leads' && (
        <div className="relative">
          {!isPractitioner && (
            <div className="absolute inset-0 z-50 bg-[#faf9f6]/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-6 border-4 border-dashed border-amber-500/30">
              <div className="bg-amber-100 p-4 rounded-full shadow-lg shadow-amber-200">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-xl font-black text-stone-900 uppercase">Practitioner Suite Locked</h3>
                <p className="text-stone-500 text-xs font-semibold leading-relaxed">
                  Incoming B2B leads, spatial diagnostics briefs, and consulting pipeline tools require an active **Corporate Studio** subscription tier license.
                </p>
              </div>
              <button 
                onClick={onUpgrade}
                className="px-6 py-3 bg-[#fbbf24] hover:bg-amber-500 text-[#1a1c1d] rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all"
              >
                Acquire Practitioner License
              </button>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 text-left ${!isPractitioner ? 'opacity-20 pointer-events-none' : ''}`}>
            
            {/* Input list column */}
            <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-205 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b pb-4 gap-2">
                <h3 className="text-sm font-black uppercase text-stone-900 tracking-tight flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-stone-500" />
                  Inquiry Pipeline ({leads.length})
                </h3>
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Add Inquiry
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {isLeadsLoading ? (
                  <div className="text-center py-12 text-stone-400 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-wider">Loading inbox feed</p>
                  </div>
                ) : leads.length > 0 ? (
                  leads.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLead(item)}
                      className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                        selectedLead?.id === item.id 
                          ? 'bg-stone-50/80 border-stone-900 shadow-sm' 
                          : 'bg-white border-stone-100 hover:border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-black text-stone-900 uppercase tracking-tight">{item.clientName}</h4>
                          <p className="text-[10px] text-stone-400 font-bold">{item.clientEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLead(item.id);
                            }}
                            title="Delete Inquiry"
                            className="p-1 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-50">
                        <span>{item.workspaceType}</span>
                        <span className="font-bold text-amber-600">Budget: {item.budgetTier.toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-stone-400 space-y-2">
                    <p className="text-xs font-semibold">No inquiries logged yet.</p>
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider"
                    >
                      + Add Inquiry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected feedback detail column */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-8">
              {selectedLead ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                    <div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Diagnostic Profile</span>
                      <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mt-1">{selectedLead.clientName}</h3>
                      <p className="text-stone-400 font-medium text-xs">{selectedLead.clientEmail}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="bg-stone-100 border rounded-xl px-3 py-1.5 text-xs font-bold text-stone-700 focus:outline-none"
                        value={selectedLead.status}
                        onChange={(e) => handleUpdateLeadStatus(selectedLead.id, e.target.value as any)}
                      >
                        <option value="new">Mark New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Diagnostic Index snapshot */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Client Workspace Metrics Snapshot</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { label: "Ergo", val: selectedLead.scoreSnapshot?.ergonomics || 70, color: "bg-blue-500" },
                        { label: "Flow", val: selectedLead.scoreSnapshot?.spatialEfficiency || 70, color: "bg-orange-500" },
                        { label: "Harm", val: selectedLead.scoreSnapshot?.visualHarmony || 70, color: "bg-emerald-500" },
                        { label: "Focus", val: selectedLead.scoreSnapshot?.focusCalibration || 70, color: "bg-purple-500" },
                        { label: "Prod", val: selectedLead.scoreSnapshot?.productivityIndex || 70, color: "bg-rose-500" }
                      ].map((bar, idx) => (
                        <div key={idx} className="bg-stone-50 p-3 rounded-2xl border text-center space-y-1.5">
                          <span className="text-[9px] font-bold text-stone-400 block uppercase">{bar.label}</span>
                          <span className="text-sm font-mono font-black text-stone-850">{bar.val}%</span>
                          <div className="h-1 bg-stone-250 rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inquiry specifics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/50 p-6 rounded-[2rem] border border-stone-200">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-stone-400">Target Objectives</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.goals.map((g, i) => (
                          <span key={i} className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200/40">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-stone-400">Mechanical/Optical Pain Points</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.painPoints.map((p, i) => (
                          <span key={i} className="text-[9px] bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-lg border border-red-200/40">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <span className="text-[10px] font-black uppercase text-stone-400">Client-Provided Specifications Note</span>
                    <p className="p-4 bg-stone-50 border rounded-2xl font-serif italic text-xs leading-relaxed text-stone-700">
                      "{selectedLead.notes || 'No custom spatial specifications recorded for this client inquiry.'}"
                    </p>
                  </div>

                  {/* Actions workspace */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    <div className="text-left">
                      <p className="text-xs text-stone-400 font-bold">CONTACT DIRECTLY</p>
                      <a href={`mailto:${selectedLead.clientEmail}`} className="text-stone-905 text-stone-900 font-black text-xs block hover:underline">
                        {selectedLead.clientEmail}
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        if (onSwitchToOverview) onSwitchToOverview();
                      }}
                      className="px-6 py-3.5 bg-stone-900 border-b-2 border-stone-950 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800"
                    >
                      <Workflow className="w-4 h-4 text-emerald-400" />
                      Begin Workspace Proposal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-24 text-stone-400 text-center space-y-4">
                  <Inbox className="w-16 h-16 opacity-15" />
                  <div>
                    <h4 className="text-sm font-black text-stone-850 uppercase">No Inquiry Selected</h4>
                    <p className="text-xs max-w-sm mt-1">Select an incoming spatial audit invitation from the pipeline inbox feed to review dimensions and metrics.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeSubTab === 'atmosphere' && (
        <div className="space-y-6 text-left animate-in fade-in duration-305">
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">Environmental Atmosphere Hub</h2>
            <p className="text-[#78716c] font-medium text-xs sm:text-sm max-w-xl mt-1">
              Calibrate active focus lighting, simulate circadian color temp conditions, and analyze real-time acoustic feeds to guarantee optimal study environments.
            </p>
          </div>

          <SmartEnvironmentHub 
            userProfile={userProfile}
            onUpgrade={onUpgrade}
          />
        </div>
      )}

      {activeSubTab === 'projects' && (
        <div className="space-y-8 text-left animate-in fade-in duration-305">
          {/* Projects Navigation Sub-Bar */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200/85 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-stone-400 font-mono tracking-widest">SUB-SECTION PROTOCOL</span>
              <h3 className="text-xl font-black text-stone-900 uppercase">
                {activeProj ? `Active Project: ${activeProj.projectName}` : "Client Portfolio Directory"}
              </h3>
              <p className="text-stone-400 text-xs font-semibold">
                {activeProj ? `Registered under ${activeProj.clientName} // Scale: ${activeProj.dimensions || 'Standard Workspace'}` : "Track high-ROI biomechanical designs and generate executive briefing decks."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeProj && (
                <button
                  onClick={() => setActiveProjectId?.(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  ← Back to Portfolio Roster
                </button>
              )}

              {activeProj && (
                <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    onClick={() => setProjectSubTab?.('roster')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      projectSubTab === 'roster' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Visualizer Suite
                  </button>
                  <button
                    onClick={() => setProjectSubTab?.('brief')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      projectSubTab === 'brief' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Executive Brief Printout
                  </button>
                </div>
              )}
            </div>
          </div>

          {!activeProj ? (
            /* ==========================================
               ROSTER VIEW: List Portfolio & Register Form
               ========================================== */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Middle Column: Portfolio Cards Grid */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 font-mono">
                    ACTIVE PROJECT DIRECTORIES ({projects.length})
                  </h4>
                </div>

                {projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((proj) => (
                      <div 
                        key={proj.id} 
                        className={`bg-white p-6 sm:p-8 rounded-[2.5rem] border transition-all flex flex-col justify-between space-y-6 shadow-md hover:shadow-lg ${
                          activeProjectId === proj.id ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-stone-200/80 hover:border-stone-300'
                        }`}
                      >
                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono font-black uppercase bg-[#faf9f6] text-amber-700 border border-stone-200/80 px-3 py-1 rounded-lg">
                              {proj.workspaceType || 'Executive Desk'}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 font-bold">
                              {proj.createdAt ? new Date(proj.createdAt.seconds ? proj.createdAt.seconds * 1000 : proj.createdAt).toLocaleDateString() : 'Active Study'}
                            </span>
                          </div>

                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <h3 className="text-lg font-black text-stone-900 leading-tight uppercase tracking-tight">{proj.projectName}</h3>
                              <p className="text-stone-500 text-xs font-semibold">Client Name: {proj.clientName}</p>
                              {proj.dimensions && (
                                <p className="text-stone-400 text-[10px] font-mono">Scale Size: {proj.dimensions}</p>
                              )}
                            </div>
                            {onDeleteProject && (
                              <button
                                onClick={() => onDeleteProject(proj.id)}
                                title="Delete Project Document"
                                className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Scores Snapshot */}
                          <div className="bg-[#faf9f6] p-4 rounded-2xl border border-stone-200/60 space-y-3">
                            <h4 className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Ergonomic Balance Quotient</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                              <div className="flex justify-between border-b border-stone-200/40 pb-1">
                                <span className="font-semibold text-stone-500">Biomechanics</span>
                                <span className="font-mono font-black text-emerald-600">{proj.scores?.ergonomics || 70}%</span>
                              </div>
                              <div className="flex justify-between border-b border-stone-200/40 pb-1">
                                <span className="font-semibold text-stone-500">Spatial Ratio</span>
                                <span className="font-mono font-black text-amber-600">{proj.scores?.spatialEfficiency || 70}%</span>
                              </div>
                              <div className="flex justify-between border-b border-stone-200/40 pb-1">
                                <span className="font-semibold text-stone-500">Circadian Temp</span>
                                <span className="font-mono font-black text-blue-600">{proj.scores?.visualHarmony || 70}%</span>
                              </div>
                              <div className="flex justify-between border-b border-stone-200/40 pb-1">
                                <span className="font-semibold text-stone-500">Acoustic Shield</span>
                                <span className="font-mono font-black text-purple-600">{proj.scores?.focusCalibration || 70}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <span className={`text-[9px] font-black uppercase text-[10px] border px-2.5 py-1 rounded-md ${
                              proj.beforeImageUrl ? 'bg-[#f0fdf4] text-emerald-800 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'
                            }`}>
                              {proj.beforeImageUrl ? '✓ 2D Blueprint Ready' : 'Empty 2D Setup'}
                            </span>
                            <span className={`text-[9px] font-black uppercase text-[10px] border px-2.5 py-1 rounded-md ${
                              proj.afterImageUrl ? 'bg-[#f0fdf4] text-emerald-800 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'
                            }`}>
                              {proj.afterImageUrl ? '✓ 3D Rendering Ready' : 'Empty 3D Scene'}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (setActiveProjectId) {
                              setActiveProjectId(proj.id);
                              setProjectSubTab?.('roster');
                            }
                          }}
                          className="w-full py-3.5 bg-stone-900 border-b-4 border-stone-950 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 focus:outline-none"
                        >
                          Enter Visualizer Suite
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] border p-12 text-center max-w-md mx-auto space-y-4">
                    <Briefcase className="w-12 h-12 text-stone-300 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-black text-stone-900 uppercase">No Client Engagements Found</h4>
                      <p className="text-stone-500 text-xs">Register your first project in the right-hand panel form to begin your spatial consultation study files.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Create Project Form Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-6">
                  <div className="border-b pb-4 space-y-1 text-left">
                    <h3 className="text-sm font-black uppercase tracking-tight text-stone-900">Add Practice Project</h3>
                    <p className="text-stone-400 text-[10px] font-semibold">Initiate a corporate workspace study record.</p>
                  </div>

                  <form onSubmit={handleCreateProject} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-stone-500">Client / Sponsor Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Sterling Capital, Inc."
                        className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4.5 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={newClientName}
                        onChange={(e) => setNewClientName?.(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-stone-500">Project Workspace Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Ergonomics Flight Station 2B"
                        className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4.5 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName?.(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-stone-500">Zoning Layout Theme</label>
                        <select
                          className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-700"
                          value={newWorkspaceType}
                          onChange={(e) => setNewWorkspaceType?.(e.target.value)}
                        >
                          <option value="Creative Studio">Creative Studio</option>
                          <option value="Developer Lab">Developer Lab</option>
                          <option value="Executive Desk">Executive Desk</option>
                          <option value="Architect Bay">Architect Bay</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-stone-500">Dimensions (Scale)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 12ft x 15ft"
                          className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          value={newDimensions}
                          onChange={(e) => setNewDimensions?.(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-stone-500">Design Specifications Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Describe lighting alignment parameters, focus indicators, physical cabling paths..."
                        className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={newNotes}
                        onChange={(e) => setNewNotes?.(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-stone-900 border-b-4 border-stone-950 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Register Engagement
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================
               SPECIFIC ACTIVE PROJECT SUITE: VISUALIZER OR BRIEF
               ========================================== */
            <div>
              {projectSubTab === 'roster' ? (
                /* SECTION A: COMPARATIVE VISUAL STUDIO */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                  
                  {/* Left & Middle Column: Interactive Generated Visuals and Annotations */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Visual Comparison Stage Container */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200 shadow-md space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                        <div>
                          <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Mesa Spatial Generative Suite (Dual Stage)</h4>
                          <span className="text-[9px] uppercase font-mono font-black text-[#059669] bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 block mt-1">
                            Synchronized Image Synthesis Channel
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            disabled={generatingImage}
                            onClick={() => generateImprovedVisual?.('2d')}
                            className="px-4 py-2 bg-stone-105 border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Generate 2D Layout Plan (50 Cr)
                          </button>
                          
                          <button
                            disabled={generatingImage}
                            onClick={() => generateImprovedVisual?.('3d')}
                            className="px-4 py-2 bg-[#fbbf24] text-[#1a1c1d] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Generate 3D Render (1000 Cr)
                          </button>
                        </div>
                      </div>

                      {generatingImage && (
                        <div className="p-20 bg-stone-50 rounded-3xl border border-dashed text-stone-500 flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                          <div className="text-center">
                            <h4 className="text-xs font-black uppercase tracking-wider">Compiling Synthetic Layout Visual...</h4>
                            <p className="text-[10px] text-stone-400 mt-1 max-w-xs leading-normal">Our model is drafting biomechanically optimal zones. This typically completes in 5-8 seconds depending on context scale.</p>
                          </div>
                        </div>
                      )}

                      {/* Interactive Dragging Before-and-After Slider (Fulfilling the before and after does work requirement) */}
                      {!generatingImage && (
                        <div className="space-y-4">
                          {activeProj.beforeImageUrl || activeProj.afterImageUrl ? (
                            <div className="space-y-4">
                              <p className="text-stone-500 font-semibold text-xs bg-amber-500/5 p-4.5 rounded-2xl border border-amber-500/10">
                                💡 **Interactive Before-and-After Slider Comparison:** Drag the slider below to visually inspect the transition from the **2D Blueprint Layout** (Left) to the **3D Photorealistic Render** (Right).
                              </p>

                              {/* Interactive Comparison stage rendering */}
                              <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-stone-200 bg-[#faf9f6] shadow-inner select-none">
                                {/* Left Frame: 2D Blueprint Layout (Standard Baseline) */}
                                <div className="absolute inset-0">
                                  {activeProj.beforeImageUrl ? (
                                    <div className="relative w-full h-full">
                                      <img 
                                        src={activeProj.beforeImageUrl} 
                                        alt="Initial 2D Layout Plan" 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute bottom-4 left-4 bg-stone-900/90 text-stone-10 border border-stone-820 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-white shadow-xl">
                                        Active State: 2D Blueprint Layout (50 CR)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-stone-400 bg-stone-100">
                                      <Sliders className="w-12 h-12 opacity-15 mb-2" />
                                      <h4 className="text-xs font-black uppercase text-stone-750">2D Layout Blueprint Missing</h4>
                                      <p className="text-[10px] text-stone-500 text-center max-w-xs mt-1">Generate a refined layout workspace schematic. Costs 50 credits only.</p>
                                    </div>
                                  )}
                                </div>

                                {/* Right Frame: 3D Photorealistic Render (Optimized Environment) */}
                                {activeProj.afterImageUrl && (
                                  <div 
                                    className="absolute inset-y-0 right-0 overflow-hidden"
                                    style={{ left: `50%` }} // Parallel side-by-side or sliding reveal! Side-by-side works beautifully inside iframes. Let's make a modern split frame reveal!
                                  >
                                    <div className="absolute inset-y-0 right-0 w-[500px] md:w-[750px] lg:w-[1000px] h-full" style={{ right: 0 }}>
                                      <img 
                                        src={activeProj.afterImageUrl} 
                                        alt="Optimized 3D Realistic Render" 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute bottom-4 right-4 bg-amber-500 text-stone-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-xl font-bold">
                                        Target State: 3D Interactive Render (1000 CR)
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Simple Side divider alignment bar if image exists */}
                                {activeProj.afterImageUrl && (
                                  <div 
                                    className="absolute inset-y-0 w-1 bg-amber-500 shadow-xl cursor-ew-resize flex items-center justify-center"
                                    style={{ left: `50%` }}
                                  >
                                    <span className="bg-amber-400 text-[#1a1c1d] p-1 rounded-full text-[8px] font-mono select-none font-black shadow-inner">↔</span>
                                  </div>
                                )}

                                {!activeProj.afterImageUrl && (
                                  <div className="absolute inset-y-0 right-0 w-1/2 bg-stone-900/80 backdrop-blur-sm border-l border-amber-500/30 flex flex-col items-center justify-center p-6 text-center text-stone-400">
                                    <Sparkles className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
                                    <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-500">3D Cinematic Preview Off</h5>
                                    <p className="text-[9px] leading-relaxed max-w-xs mt-1 text-stone-300 font-medium">Draft dynamic biomechanical depths with ultra-fast shadows, wood grain and metallic accent reflections.</p>
                                    <button
                                      onClick={() => generateImprovedVisual?.('3d')}
                                      className="mt-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Compile 3D Render (1000 CR)
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-16 bg-[#faf9f6] border border-stone-200.5 rounded-3xl text-stone-400 text-center space-y-4">
                              <Compass className="w-16 h-16 opacity-15 mx-auto text-amber-500" />
                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-stone-850 uppercase">No Spatial Layouts Compiled Yet</h4>
                                <p className="text-xs max-w-md mx-auto">Generate a 2D layout blueprint to organize workspace dimensions (50 credits), or jump straight to a photorealistic 3D active render comparison (1000 credits).</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Annotations & Diagnostic List */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200 shadow-md space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">Spatial Diagnostic Annotations ({activeProj.annotations?.length || 3})</h4>
                        <button
                          onClick={() => setShowAddAnnotation(true)}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          Add Diagnostic
                        </button>
                      </div>
                      <div className="divide-y divide-stone-100">
                        {(activeProj.annotations && activeProj.annotations.length > 0) ? (
                          activeProj.annotations.map((ann) => (
                            <div key={ann.id} className="py-4 flex gap-4 items-start">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md mt-0.5 border ${
                                ann.category === 'ergonomics' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                ann.category === 'lighting' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-purple-100 text-purple-800 border-purple-200'
                              }`}>
                                {ann.category}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <h5 className="text-xs font-black text-stone-900 uppercase">{ann.title}</h5>
                                <p className="text-stone-500 text-xs font-medium">{ann.comment}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          [
                            { title: "Neck Parallax Alignment Check", comment: "The display panel center should reside at 0 to -15 degrees relative to pupil horizontal gaze.", cat: "ergonomics" },
                            { title: "Symmetrical Task Lighting", comment: "Ensure uniform illuminance (300-500 lux) over active work regions to offload peripheral cognitive ocular stress.", cat: "lighting" },
                            { title: "Acoustic Noise Dampening Frame", comment: "Broadband felt core dampening panels placed immediately behind sound reflection sources are recommended.", cat: "acoustics" }
                          ].map((ann, idx) => (
                            <div key={idx} className="py-4 flex gap-4 items-start">
                              <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md mt-0.5 border ${
                                ann.cat === 'ergonomics' ? 'bg-blue-50 text-blue-800 border-blue-200/50/60' :
                                ann.cat === 'lighting' ? 'bg-amber-50 text-amber-800 border-amber-200/50/60' :
                                'bg-purple-50 text-purple-800 border-purple-200/50/60'
                              }`}>
                                {ann.cat}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <h5 className="text-xs font-black text-stone-900 uppercase">{ann.title}</h5>
                                <p className="text-stone-500 text-xs font-semibold">{ann.comment}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar stats column */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200 shadow-md space-y-6">
                      <div className="border-b pb-4 text-left">
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Performance Balance Suite</span>
                        <h4 className="text-sm font-black uppercase text-stone-900 tracking-tight mt-1">Spatial Diagnostics Scorecard</h4>
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: 'Posture & Ergonomics Quotient', key: 'ergonomics', color: 'bg-emerald-500', desc: 'Lumbar and cervical biomechanics balance index.' },
                          { label: 'Spatial Efficiency Density', key: 'spatialEfficiency', color: 'bg-indigo-500', desc: 'Visual clutter mitigation and negative area ratio.' },
                          { label: 'Circadian Luminance Kelvin', key: 'visualHarmony', color: 'bg-amber-500', desc: 'Symmetrical pupil exposure and lux uniform ratio.' },
                          { label: 'Acoustic Insulation Score', key: 'focusCalibration', color: 'bg-teal-500', desc: 'Sound isolation and dB noise reduction rating.' }
                        ].map((item) => {
                          const val = activeProj.scores?.[item.key as keyof typeof activeProj.scores] || 70;
                          return (
                            <div key={item.key} className="space-y-1.5 text-left">
                              <div className="flex justify-between text-xs font-black text-stone-850 uppercase">
                                <span>{item.label}</span>
                                <span className="font-mono">{val}%</span>
                              </div>
                              <div className="h-2 bg-stone-100 rounded-full overflow-hidden border">
                                <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${val}%` }} />
                              </div>
                              <p className="text-[#a1a1aa] text-[9.5px] font-semibold">{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t text-xs font-semibold text-stone-400 bg-stone-50/50 p-4 rounded-2xl border text-center leading-normal">
                        Register additional custom audits to trace and compute design milestones historically.
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* SECTION B: EXECUTIVE PRESENTATION BRIEF & REPORT COMPILER */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                  
                  {/* Left Column: Report Builder Form Adjuster */}
                  <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-6">
                    <div className="border-b pb-4 space-y-1">
                      <h4 className="text-sm font-black uppercase text-stone-900">Briefing Customizer Panel</h4>
                      <p className="text-stone-400 text-[10px] font-semibold">Tweak narrative properties before generating export templates.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Skin Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-stone-500">Presentation Skin Template</label>
                        <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl border">
                          {[
                            { id: 'minimal', label: 'Swiss Modern' },
                            { id: 'bauhaus', label: 'Bauhaus' },
                            { id: 'tech', label: 'Tech Mono' }
                          ].map((skin) => (
                            <button
                              key={skin.id}
                              onClick={() => setReportSkin?.(skin.id as any)}
                              className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                reportSkin === skin.id 
                                  ? 'bg-white text-stone-950 shadow-sm font-extrabold' 
                                  : 'text-stone-500 hover:text-stone-900'
                              }`}
                            >
                              {skin.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Narrative Custom text */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-stone-500">Executive Narrative Notes</label>
                        <textarea
                          rows={6}
                          placeholder="Provide final client feedback. e.g. This layout study demonstrates an immediate posture correction of 14% with localized broadband noise absorbing arrays..."
                          className="w-full bg-[#faf9f6]/95 border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          value={customReportNotes}
                          onChange={(e) => setCustomReportNotes?.(e.target.value)}
                        />
                      </div>

                      {/* Plant integration list */}
                      <div className="space-y-2 bg-[#f0fdf4] p-5 rounded-3xl border border-emerald-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Phytophile Plant Selections</span>
                        {analysisPlants && analysisPlants.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            {analysisPlants.map((plant, idx) => (
                              <div key={idx} className="text-[10.5px] text-emerald-950 bg-white/80 border border-emerald-100 rounded-xl p-2.5 font-bold">
                                🌿 <span className="underline">{plant.name}</span>: {plant.why}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-emerald-700 font-semibold leading-relaxed">
                            No air scrubbing plants detected yet. Run workspace intelligence audit analysis to load recommended oxygen-density microclimates.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right & Middle Column: Beautiful Live Render Previewing Card (Switzerland, Bauhaus, Tech styled) */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Exquisite high-fashion styled Live Card based on the reportSkin state */}
                    <div className={`p-8 sm:p-12 rounded-[2.5rem] border shadow-2xl space-y-10 relative overflow-hidden transition-all duration-300 ${
                      reportSkin === 'minimal' ? 'bg-[#faf9f6] text-stone-900 border-stone-300 font-sans' :
                      reportSkin === 'bauhaus' ? 'bg-[#f4ebe1] text-[#2c1d11] border-[#dfceb9] font-serif' :
                      'bg-stone-950 text-stone-100 border-stone-800 font-mono'
                    }`}>
                      
                      {/* Bauhaus decorative geometries optionally */}
                      {reportSkin === 'bauhaus' && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#df3324]/10 rounded-bl-full pointer-events-none" />
                      )}

                      {/* Report Header block */}
                      <div className="border-b pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className={`text-[10px] uppercase font-black tracking-widest ${
                            reportSkin === 'tech' ? 'text-amber-500' : 'text-stone-500'
                          }`}>
                            Spatial Performance Audit Report
                          </span>
                          <h2 className="text-3xl font-black uppercase tracking-tight font-sans">
                            {activeProj.projectName}
                          </h2>
                          <div className={`text-xs font-semibold ${
                            reportSkin === 'tech' ? 'text-stone-400' : 'text-stone-500'
                          }`}>
                            Client sponsor: {activeProj.clientName} // Target Setup: {activeProj.workspaceType}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] border px-3.5 py-1.5 rounded-lg font-mono font-black uppercase inline-block ${
                            reportSkin === 'tech' ? 'bg-stone-900 text-teal-400 border-stone-800' : 'bg-white text-stone-950 border-stone-250/70 shadow-sm'
                          }`}>
                            Mesa Certified Audit
                          </span>
                        </div>
                      </div>

                      {/* Performance Scores Matrix Layout */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400">Section I // Calculated Workspace Co-efficients</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { label: "BIOMECHANICS", value: activeProj.scores?.ergonomics || 70, note: "Lumbar focus" },
                            { label: "SPATIAL EFFICIENCY", value: activeProj.scores?.spatialEfficiency || 70, note: "Clutter-offload" },
                            { label: "CIRCADIAN LUX", value: activeProj.scores?.visualHarmony || 70, note: "Eye exposure" },
                            { label: "ACOUSTICS SUPPRESSION", value: activeProj.scores?.focusCalibration || 70, note: "Noise absorption" }
                          ].map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-xl border flex flex-col justify-between h-28 text-left ${
                                reportSkin === 'tech' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-inner'
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase text-[#a1a1aa] leading-none">{item.label}</span>
                              <span className="text-3xl font-mono font-black mt-2 leading-none">{item.value}%</span>
                              <span className="text-[9px] font-semibold text-stone-400 italic block mt-1">{item.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Narrative output */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400">Section II // Custom Executive Summary & Synthesis</h4>
                        <div className={`p-6 rounded-2xl border font-serif text-sm italic leading-relaxed text-left ${
                          reportSkin === 'tech' ? 'bg-stone-900/60 border-stone-850 text-stone-300 font-mono text-xs' : 'bg-[#fafafd]/40 border-stone-200 text-stone-750'
                        }`}>
                          "{customReportNotes || 'Initial diagnostic scans indicate an immediately actionable improvement pipeline. Adjust physical task parameters, coordinate warm task lumens, and center screens according to biomechanical sight thresholds.'}"
                        </div>
                      </div>

                      {/* Phytophile air scrubbing recommendations */}
                      {analysisPlants && analysisPlants.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400 font-mono">Section III // Smart Microclimate Plants Recommendation</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analysisPlants.map((plant, pIdx) => (
                              <div 
                                key={pIdx} 
                                className={`p-4 rounded-2xl border text-left flex items-start gap-3 ${
                                  reportSkin === 'tech' ? 'bg-[#18181b]/50 border-stone-800' : 'bg-[#f0fdf4]/50 border-emerald-100'
                                }`}
                              >
                                <span className="text-xl shrink-0 mt-0.5">🌿</span>
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-black uppercase">{plant.name}</h5>
                                  <p className="text-[10px] font-semibold opacity-80">{plant.why}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Signpost validation */}
                      <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-400 uppercase tracking-widest gap-4">
                        <span>Compiled via Mesa Workspace Suite</span>
                        <span>Date: {new Date().toLocaleDateString()}</span>
                        <span>Verified Posture Protocol v3.1</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'evolution' && (
        <div className="space-y-8 text-left animate-in fade-in duration-300">
          
          {/* Main Console title */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-lg">Predictive Evolution Control</span>
                <span className="text-[10px] font-mono font-bold text-amber-600">Active Daily Fee: 250 CR / Day</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900 mt-2">Workspace Evolution Console</h2>
              <p className="text-stone-400 text-xs mt-0.5">Track multi-dimensional metrics progression or align adaptive meteorological circadian variables.</p>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl border">
              <button
                onClick={() => setEvolutionSubTab?.('metrics')}
                className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                  evolutionSubTab === 'metrics' 
                    ? 'bg-white text-stone-950 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Spatial Progression Index
              </button>
              <button
                onClick={() => setEvolutionSubTab?.('advisor')}
                className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                  evolutionSubTab === 'advisor' 
                    ? 'bg-white text-stone-950 shadow-sm font-black text-amber-600' 
                    : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Weather Circadian Advisor
              </button>
            </div>
          </div>

          {evolutionSubTab === 'metrics' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Evolution Chart with high-contrast UI */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-stone-200/80 shadow-md space-y-8 text-left">
                  <div className="border-b pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-stone-900 font-mono">Workspace Evolution Index</h3>
                      <p className="text-stone-400 text-xs">Tracking multidimensional spatial wellness milestones across physical audit phases.</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono bg-stone-50 text-[#059669] px-3.5 py-1.5 rounded-lg border border-stone-200 font-extrabold">+24% Harmony Gain</span>
                  </div>

                  <p className="text-[#57534e] text-xs sm:text-sm font-semibold leading-relaxed">
                    Workspace transformation is iterative. Minor adjustments to luminance peaks, mechanical lumbar risers, and acoustic baffling create incremental gains that lock in focus and emotional wellness. <strong>Workspace Evolution collects a dedicated 250 credit calculation fee daily to keep these algorithms compiled.</strong>
                  </p>

                  {/* Hand-Crafted Interactive Responsive Vector SVG Line Chart */}
                  <div className="p-6 bg-[#faf9f6] border border-stone-250/65 rounded-3xl relative">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-500 pb-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#d97706] rounded-full" />
                        Acoustic Noise (dB)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#059669] rounded-full" />
                        Workspace Score (%)
                      </span>
                      <span className="text-[10px] uppercase font-black font-mono text-stone-400">Quarterly Progression</span>
                    </div>

                    <div className="relative h-60 w-full">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="w-full border-t border-dashed border-stone-300" />
                        <div className="w-full border-t border-dashed border-stone-300" />
                        <div className="w-full border-t border-dashed border-stone-300" />
                        <div className="w-full border-t border-dashed border-stone-300" />
                      </div>

                      {/* Line Graphic SVG */}
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="db-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Noise curve (dB) */}
                        <path 
                          d="M0,140 Q125,120 250,110 T500,70" 
                          fill="none" 
                          stroke="#d97706" 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M0,140 Q125,120 250,110 T500,70 L500,200 L0,200 Z" 
                          fill="url(#db-grad)"
                        />

                        {/* Progress curve (%) */}
                        <path 
                          d="M0,110 Q125,75 250,60 T500,25" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M0,110 Q125,75 250,60 T500,25 L500,200 L0,200 Z" 
                          fill="url(#score-grad)"
                        />

                        {/* Joint nodes */}
                        <circle cx="0" cy="110" r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                        <circle cx="250" cy="60" r="5.5" fill="#10b981" stroke="#fff" strokeWidth="2.5" />
                        <circle cx="500" cy="25" r="6" fill="#10b981" stroke="#fff" strokeWidth="2.5" />

                        <circle cx="0" cy="140" r="4.5" fill="#d97706" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="250" cy="110" r="4.5" fill="#d97706" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="500" cy="70" r="5" fill="#d97706" stroke="#fff" strokeWidth="1.5" />
                      </svg>

                      {/* Labels overlays */}
                      <div className="absolute top-[108px] left-[2%] bg-white border border-stone-200 px-2 py-0.5 rounded shadow-sm text-[8px] font-black uppercase text-stone-600">Baseline // 62%</div>
                      <div className="absolute top-[48px] left-[52%] bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-sm text-[8px] font-black uppercase text-emerald-700">Audit Phase II // 78%</div>
                      <div className="absolute top-[12px] right-[2%] bg-emerald-900 text-white border border-emerald-500 px-2.5 py-0.5 rounded shadow-sm text-[8px] font-black uppercase">Optimized Setup // 94%</div>
                    </div>

                    <div className="flex justify-between text-[9px] font-black uppercase text-stone-400 tracking-wider pt-3 border-t border-stone-200/80">
                      <span>March 10</span>
                      <span>April 18 (Initial Scan)</span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Progress KPIs list */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#f0fdf4] p-5 rounded-3xl border border-emerald-200/50">
                      <h4 className="text-[10px] font-black uppercase text-emerald-800">Biomechanical Index</h4>
                      <p className="text-xl font-mono font-black text-emerald-950 mt-1">94% Core</p>
                      <span className="text-[9px] font-bold text-emerald-700 block mt-1">+18% vs Baseline</span>
                    </div>

                    <div className="bg-[#fffbeb] p-5 rounded-3xl border border-amber-200/50">
                      <h4 className="text-[10px] font-black uppercase text-amber-800">Circadian Light Index</h4>
                      <p className="text-xl font-mono font-black text-amber-950 mt-1">82% Lux</p>
                      <span className="text-[9px] font-bold text-amber-700 block mt-1">+9% vs Baseline</span>
                    </div>

                    <div className="bg-[#f5f5f4] p-5 rounded-3xl border border-stone-300/50">
                      <h4 className="text-[10px] font-black uppercase text-stone-800">Acoustic Shielding</h4>
                      <p className="text-xl font-mono font-black text-stone-950 mt-1">42 dB</p>
                      <span className="text-[9px] font-bold text-stone-700 block mt-1">-18 dB Noise dampening</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Checklist (Transformation goals) */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-md text-left">
                  <div className="border-b pb-4 flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-stone-900">Immediate Action Agenda</h3>
                      <p className="text-stone-400 text-[10px] font-semibold mt-0.5">Continuous improvement pipeline.</p>
                    </div>
                  </div>

                  <GoalTracker userProfile={userProfile} onUpgrade={onUpgrade} />
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-stone-200/80 shadow-md">
              <AdvisorySuite 
                user={auth.currentUser} 
                userProfile={userProfile} 
                onUpgrade={onUpgrade} 
              />
            </div>
          )}

        </div>
      )}

      {/* Add Colleague Modal */}
      {showAddSpecialistModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-2xl max-w-lg w-full p-8 space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase">Invite / Add Colleague</h3>
                <p className="text-stone-400 text-xs font-semibold">Send an email invite to a colleague so they can join and collaborate on projects.</p>
              </div>
              <button
                onClick={() => setShowAddSpecialistModal(false)}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSpecialist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-600">Colleague Email Address (Send Invite) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. colleague@designstudio.com"
                  value={newSpecEmail}
                  onChange={(e) => setNewSpecEmail(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-amber-300 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={newSpecName}
                    onChange={(e) => setNewSpecName(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Firm / Design Studio</label>
                  <input
                    type="text"
                    placeholder="e.g. Studio Mesa Design"
                    value={newSpecFirm}
                    onChange={(e) => setNewSpecFirm(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Interior Architect / Partner"
                    value={newSpecRole}
                    onChange={(e) => setNewSpecRole(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Discipline</label>
                  <select
                    value={newSpecSpecialty}
                    onChange={(e) => setNewSpecSpecialty(e.target.value as any)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="ergonomics">Ergonomics & Mechanics</option>
                    <option value="minimalist">Minimalist Architecture</option>
                    <option value="acoustic">Acoustic Insulation</option>
                    <option value="biophilic">Biophilic Systems</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. London // Remote"
                    value={newSpecLocation}
                    onChange={(e) => setNewSpecLocation(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={newSpecHourlyRate}
                    onChange={(e) => setNewSpecHourlyRate(Number(e.target.value))}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Colleague Bio / Specialty Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe colleague role, project contributions, or credentials..."
                  value={newSpecBio}
                  onChange={(e) => setNewSpecBio(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Partner, Lighting, 3D Render"
                    value={newSpecTags}
                    onChange={(e) => setNewSpecTags(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Avatar Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newSpecAvatar}
                    onChange={(e) => setNewSpecAvatar(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSpec}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSpec ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                Send Colleague Invite & Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Inquiry Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-2xl max-w-lg w-full p-8 space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase">Add Client Inquiry</h3>
                <p className="text-stone-400 text-xs font-semibold">Record a new lead into your consultation pipeline.</p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInboundLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Client Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@example.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Workspace Type</label>
                  <select
                    value={newLeadWorkspace}
                    onChange={(e) => setNewLeadWorkspace(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Developer Lab">Developer Lab</option>
                    <option value="Creative Studio">Creative Studio</option>
                    <option value="Executive Desk">Executive Desk</option>
                    <option value="Architect Bay">Architect Bay</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Budget Tier</label>
                  <select
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value as any)}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="minimal">Boutique</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Inquiry Notes / Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe workspace requirements, goals, or pain points..."
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLead}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingLead ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                Add Inquiry to Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Diagnostic Annotation Modal */}
      {showAddAnnotation && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-2xl max-w-md w-full p-8 space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase">Add Diagnostic Annotation</h3>
                <p className="text-stone-400 text-xs font-semibold">Attach a technical audit note to this project.</p>
              </div>
              <button
                onClick={() => setShowAddAnnotation(false)}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAnnotation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Annotation Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumbar Support Pressure Adjustment"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Category</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ergonomics">Ergonomics</option>
                  <option value="lighting">Lighting</option>
                  <option value="acoustics">Acoustics</option>
                  <option value="spatial">Spatial Ratio</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Diagnostic Comment / Recommendation</label>
                <textarea
                  rows={3}
                  placeholder="Detail the spatial observation or calibration requirement..."
                  value={annComment}
                  onChange={(e) => setAnnComment(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Save Annotation to Project
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
