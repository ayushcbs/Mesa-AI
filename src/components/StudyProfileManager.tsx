import React, { useState } from 'react';
import { 
  User, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Sliders, 
  Lightbulb, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  X, 
  BookOpen, 
  Clock, 
  Camera, 
  Save, 
  FolderPlus,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyProfile } from '../types';

interface StudyProfileManagerProps {
  profiles: StudyProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (profile: Omit<StudyProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProfile: (profileId: string, updates: Partial<StudyProfile>) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onClose: () => void;
  savedAnalysisCountByProfile?: Record<string, number>;
}

export function StudyProfileManager({
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onClose,
  savedAnalysisCountByProfile = {}
}: StudyProfileManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [studyFocus, setStudyFocus] = useState('Computer Science & Tech');
  const [deskDimensions, setDeskDimensions] = useState('140cm x 70cm Standard');
  const [lighting, setLighting] = useState('4200K Natural White, Indirect Task Lamp');
  const [chairType, setChairType] = useState('Ergonomic Mesh Chair with Lumbar Support');
  const [comfortNeeds, setComfortNeeds] = useState('Reduce cervical neck strain and screen glare');
  const [targetDailyFocusHours, setTargetDailyFocusHours] = useState(4);

  const resetForm = () => {
    setName('');
    setStudyFocus('Computer Science & Tech');
    setDeskDimensions('140cm x 70cm Standard');
    setLighting('4200K Natural White, Indirect Task Lamp');
    setChairType('Ergonomic Mesh Chair with Lumbar Support');
    setComfortNeeds('Reduce cervical neck strain and screen glare');
    setTargetDailyFocusHours(4);
    setIsCreating(false);
    setEditingProfileId(null);
  };

  const startEdit = (profile: StudyProfile) => {
    setEditingProfileId(profile.id);
    setName(profile.name);
    setStudyFocus(profile.studyFocus || 'General Studies');
    setDeskDimensions(profile.deskDimensions || '120cm x 60cm Standard');
    setLighting(profile.lighting || 'Warm White');
    setChairType(profile.chairType || 'Ergonomic Desk Chair');
    setComfortNeeds(profile.comfortNeeds || 'Reduce focal fatigue');
    setTargetDailyFocusHours(profile.targetDailyFocusHours || 4);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedbackMsg("Please provide a name for this study profile.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      if (editingProfileId) {
        await onUpdateProfile(editingProfileId, {
          name: name.trim(),
          studyFocus,
          deskDimensions,
          lighting,
          chairType,
          comfortNeeds,
          targetDailyFocusHours
        });
        setFeedbackMsg("Profile updated successfully.");
      } else {
        await onCreateProfile({
          name: name.trim(),
          studyFocus,
          deskDimensions,
          lighting,
          chairType,
          comfortNeeds,
          targetDailyFocusHours,
          isDefault: profiles.length === 0
        });
        setFeedbackMsg("New study profile created.");
      }
      resetForm();
    } catch (err: any) {
      setFeedbackMsg(err.message || "Failed to save profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const studyFocusPresets = [
    'Computer Science & Tech',
    'Pre-Med & Biology',
    'Architecture & Design',
    'Engineering & Math',
    'Law & Humanities',
    'High School / AP Prep',
    'Research & Graduate Studies'
  ];

  return (
    <div className="fixed inset-0 z-[250] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#faf9f6] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-900 text-white rounded-2xl shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                Study Space Profiles
              </h2>
              <p className="text-xs text-stone-500 font-semibold">
                Manage multiple study environments, preferences, and saved analysis results
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          {feedbackMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
              <span>{feedbackMsg}</span>
              <button onClick={() => setFeedbackMsg(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Action Bar: Create button toggle */}
          {!isCreating && !editingProfileId && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase text-stone-800 tracking-wide">
                  Active Profile: <span className="text-amber-600 font-extrabold">{profiles.find(p => p.id === activeProfileId)?.name || 'None'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Select an environment to load its spatial calibrations and saved scans
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setIsCreating(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create New Profile
              </button>
            </div>
          )}

          {/* Form: Create or Edit */}
          {(isCreating || editingProfileId) && (
            <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-amber-200/80 shadow-md space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black uppercase tracking-wide text-stone-900">
                    {editingProfileId ? 'Edit Study Profile' : 'Create New Study Space Profile'}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="text-xs font-bold text-stone-400 hover:text-stone-700 uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Profile Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block">
                    Profile Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Dorm Room Desk, Campus Library Corner, Home Studio"
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Study Focus */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                    Academic / Study Focus
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {studyFocusPresets.map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setStudyFocus(preset)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          studyFocus === preset
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text"
                    placeholder="Or type custom major / focus..."
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={studyFocus}
                    onChange={(e) => setStudyFocus(e.target.value)}
                  />
                </div>

                {/* Desk Dimensions */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-stone-400" />
                    Desk Dimensions & Setup
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 120cm x 60cm Compact Desk"
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={deskDimensions}
                    onChange={(e) => setDeskDimensions(e.target.value)}
                  />
                </div>

                {/* Lighting Setup */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-stone-400" />
                    Lighting Environment
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 4000K Neutral White LED + Daylight Window"
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                  />
                </div>

                {/* Chair Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    Seating / Chair Type
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Ergonomic Lumbar Mesh Chair"
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={chairType}
                    onChange={(e) => setChairType(e.target.value)}
                  />
                </div>

                {/* Daily Focus Goal */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Target Daily Focus ({targetDailyFocusHours} Hours)
                  </label>
                  <input 
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    className="w-full accent-amber-500"
                    value={targetDailyFocusHours}
                    onChange={(e) => setTargetDailyFocusHours(parseFloat(e.target.value))}
                  />
                </div>

                {/* Comfort & Strain targeting */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    Key Ergonomic Comfort & Relief Needs
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Relieve cervical neck strain, reduce afternoon eye glare"
                    className="w-full bg-[#fdfdfc] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={comfortNeeds}
                    onChange={(e) => setComfortNeeds(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-stone-600 hover:text-stone-900 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : editingProfileId ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Profiles Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                Configured Profiles ({profiles.length})
              </span>
              <span className="text-[11px] text-stone-400 font-semibold">
                Click any profile card to activate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map(profile => {
                const isActive = profile.id === activeProfileId;
                const analysisCount = savedAnalysisCountByProfile[profile.id] || 0;

                return (
                  <div
                    key={profile.id}
                    onClick={() => onSelectProfile(profile.id)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative text-left flex flex-col justify-between ${
                      isActive 
                        ? 'bg-white border-amber-400 shadow-md ring-2 ring-amber-400/20' 
                        : 'bg-white/80 hover:bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-amber-500 animate-pulse' : 'bg-stone-300'}`} />
                          <h4 className="font-black text-stone-900 text-sm uppercase tracking-wide">
                            {profile.name}
                          </h4>
                        </div>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Check className="w-3 h-3" />
                            Active Profile
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProfile(profile.id);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-100"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-stone-600 mb-4">
                        <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{profile.studyFocus || 'General Study'}</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Desk:</strong> {profile.deskDimensions || 'Standard'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Lighting:</strong> {profile.lighting || 'Standard'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Seating:</strong> {profile.chairType || 'Standard'}
                        </p>
                        {profile.comfortNeeds && (
                          <p className="text-[11px] text-stone-500 truncate">
                            <strong className="text-stone-700">Relief:</strong> {profile.comfortNeeds}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3 text-stone-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-stone-400" />
                          {analysisCount} {analysisCount === 1 ? 'Scan' : 'Scans'}
                        </span>
                        {profile.targetDailyFocusHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {profile.targetDailyFocusHours}h Target
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(profile)}
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {profiles.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete profile "${profile.name}"?`)) {
                                onDeleteProfile(profile.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-4 border-t border-stone-200 flex items-center justify-between">
          <p className="text-xs text-stone-400 font-medium">
            Switching profiles automatically updates the AI Scanner's ergonomic parameters.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
