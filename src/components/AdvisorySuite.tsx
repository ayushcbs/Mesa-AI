import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Cloud, 
  Sun, 
  Moon, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Trophy,
  Plus,
  Trash2,
  Settings,
  Zap,
  Lock,
  ArrowUpRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateGeminiContent } from '../lib/gemini';

interface Milestone {
  id: string;
  subject: string;
  paperType: string;
  examDate: string;
}

interface UserFirmContext {
  gradeLevel: string; // Used for Consultant Specialization
  currentGPA: string; // Used for Firm Name
  targetCareer: string; // Used for Client Target Direction
}

interface AdvisorySuiteProps {
  user: any;
  userProfile: any;
  onUpgrade: () => void;
}

export function AdvisorySuite({ user, userProfile, onUpgrade }: AdvisorySuiteProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isAdvisoryUnlocked = userProfile?.tier === 'corporate' || userProfile?.tier === 'elite' || userProfile?.hasInfiniteCredits || userProfile?.unlockedAdvisory || false;

  const handleCreditUnlock = async () => {
    if (!user) return;
    const credits = userProfile?.credits || 0;
    if (credits < 50) {
      onUpgrade();
      setUnlockError("Not enough credits to unlock Advisory Suite. This operations costs 50 credits.");
      return;
    }

    setUnlocking(true);
    setUnlockError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        credits: Math.max(0, credits - 50),
        unlockedAdvisory: true
      }, { merge: true });
    } catch (err: any) {
      setUnlockError("Failed to apply credit unlock deduction handler.");
    } finally {
      setUnlocking(false);
    }
  };

  const [academicContext, setAcademicContext] = useState<UserFirmContext>({
    gradeLevel: userProfile?.academicContext?.gradeLevel || 'Workspace Ergonomist',
    currentGPA: userProfile?.academicContext?.currentGPA || 'Mesa Spatial Partners',
    targetCareer: userProfile?.academicContext?.targetCareer || 'Circadian Calibrations & High Focus'
  });
  
  const [examCalendar, setExamCalendar] = useState<Milestone[]>(userProfile?.examCalendar || []);
  const [weatherData, setWeatherData] = useState({
    temp: '22°C',
    humidity: '65%',
    condition: 'Overcast',
    sunset: '18:45'
  });

  const [isEditingAtmosphere, setIsEditingAtmosphere] = useState(false);

  const [briefing, setBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      academicContext,
      examCalendar
    });
    setIsEditingProfile(false);
  };

  const addExam = () => {
    const newMilestone: Milestone = {
      id: Math.random().toString(36).substr(2, 9),
      subject: '',
      paperType: '',
      examDate: new Date().toISOString()
    };
    setExamCalendar([...examCalendar, newMilestone]);
  };

  const removeExam = (id: string) => {
    setExamCalendar(examCalendar.filter(e => e.id !== id));
  };

  const updateExam = (id: string, field: keyof Milestone, value: string) => {
    setExamCalendar(examCalendar.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const generateBriefing = async () => {
    setIsGenerating(true);
    try {
      const nextMilestone = examCalendar[0];
      const prompt = `
        ROLE: The Strategic Workspace Consultant, Interior Architect, and Biophilic Design Specialist.
        
        INPUTS:
        - Weather Atmospheric Condition: ${JSON.stringify(weatherData)}
        - Client High-Priority Milestone: ${nextMilestone ? `${nextMilestone.subject} (${nextMilestone.paperType}) due ${nextMilestone.examDate}` : 'General High-Efficiency Calibrations'}
        - Practice Background Context: ${academicContext.gradeLevel} at ${academicContext.currentGPA}. Practice Target Focus: ${academicContext.targetCareer}
        
        TASK:
        Generate a daily briefing document addressing the client's needs:
        1. Macro-Calibration (Atmospheric): Setup lighting (Kelvins temperature and lux level) and room temperature recommendation based on daylight state.
        2. Micro-Priority (Concentration Strategy): Detailed workspace arrangement steps for the milestone delivery.
        3. Branded Professional Signature: Actionable, high-ROI consulting tips.
        
        TONE: Premium, sophisticated, analytical, elite, high-ROI focused. NO FLUFF.
        
        STRUCTURE:
        ### 📅 Atmospheric Consultation
        **Circadian Adjustment**: [Atmospheric recommendation]
        **Spatial Focus Strategy**: [Actionable steps]
        **Interior Designer Edge**: [Tip regarding target career: ${academicContext.targetCareer}]
        **Aesthetic Setup Teaser**: [Teaser about today's layout]
      `;

      const text = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        fallbackText: `### 📅 Atmospheric Consultation\n**Circadian Adjustment**: Set task lighting to 4200K neutral daylight with 550 lux output to optimize focus for ${academicContext.targetCareer || 'deep work'}.\n**Spatial Focus Strategy**: Clear desk perimeter by 20cm; position monitor directly in line of sight to reduce cervical fatigue.\n**Interior Designer Edge**: Maintain 45-degree ambient light offset to eliminate screen reflection.`
      });

      setBriefing(text);
    } catch (err) {
      console.error("Briefing generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      {!isAdvisoryUnlocked && (
        <div className="absolute inset-0 z-[150] bg-white/55 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-6 border-4 border-dashed border-amber-200">
          <div className="bg-stone-900 p-6 rounded-[2rem] shadow-2xl shadow-stone-950/20 rotate-3 border">
            <Lock className="text-white w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-sm">
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-500/10 px-3.5 py-1.5 rounded-lg inline-block">Calibrated Consultation Gated</span>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-2">Mesa Advisory Suite</h2>
            <p className="text-stone-500 font-semibold text-xs leading-relaxed">
              Connect real-time meteorological weather feeds to synchronize indoor smart-bulbs automatically.
            </p>
            {unlockError && <p className="text-xs font-bold text-red-500 mt-2 bg-red-100 px-4 py-2 rounded-xl">{unlockError}</p>}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button 
              onClick={handleCreditUnlock}
              disabled={unlocking}
              className="flex-grow px-4 py-3 bg-[#fbbf24] text-stone-950 rounded-xl font-black text-xs shadow-md active:scale-95 flex items-center justify-center gap-2 transition-transform disabled:opacity-50 uppercase tracking-widest"
            >
              {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Unlock for 50 Credits
            </button>
            <button 
              onClick={onUpgrade}
              className="flex-grow px-4 py-3 bg-stone-950 text-stone-200 rounded-xl font-black text-xs hover:bg-stone-900 shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              Upgrade
              <Sparkles className="w-4 h-4 text-[#fbbf24]" />
            </button>
          </div>
        </div>
      )}

      <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${!isAdvisoryUnlocked ? 'opacity-20 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-stone-900 p-4 rounded-3xl shadow-xl">
              <Compass className="w-6 h-6 text-[#fbbf24]" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Weather-Adaptive Strategic Adviser</h2>
              <p className="text-[#7c726a] font-semibold text-xs">
                Real-time circadian Kelvin adjustments linked back to environmental lux sensors
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Configure Advisor Priorities
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Context Controls */}
          <AnimatePresence>
            {isEditingProfile && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-4 space-y-6 bg-white p-6 rounded-[2rem] border border-stone-200 shadow-lg text-left"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      Strategic Practice Profile
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Consultant Specialization</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Workspace Ergonomist"
                          value={academicContext.gradeLevel}
                          onChange={(e) => setAcademicContext({...academicContext, gradeLevel: e.target.value})}
                          className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Firm Title Branding</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Mesa Design Lab"
                          value={academicContext.currentGPA}
                          onChange={(e) => setAcademicContext({...academicContext, currentGPA: e.target.value})}
                          className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Target Client Improvement Goals</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lumens Control"
                          value={academicContext.targetCareer}
                          onChange={(e) => setAcademicContext({...academicContext, targetCareer: e.target.value})}
                          className="w-full bg-stone-50 border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        Engagement Delivery Pipeline
                      </h3>
                      <button onClick={addExam} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {examCalendar.map((exam) => (
                        <div key={exam.id} className="p-4 bg-stone-50 rounded-2xl border space-y-3 relative group">
                          <button 
                            onClick={() => removeExam(exam.id)}
                            className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <input 
                            placeholder="Milestone (e.g., Deliver CAD Drafts)" 
                            className="w-full bg-transparent border-b py-1 text-xs font-bold focus:border-amber-500 outline-none"
                            value={exam.subject}
                            onChange={(e) => updateExam(exam.id, 'subject', e.target.value)}
                          />
                          <div className="flex gap-2">
                            <input 
                              placeholder="Client Key Name" 
                              className="flex-grow bg-transparent border-b py-1 text-[10px] font-medium outline-none"
                              value={exam.paperType}
                              onChange={(e) => updateExam(exam.id, 'paperType', e.target.value)}
                            />
                            <input 
                              type="date"
                              className="bg-transparent text-[10px] font-medium outline-none"
                              value={new Date(exam.examDate).toISOString().split('T')[0]}
                              onChange={(e) => updateExam(exam.id, 'examDate', new Date(e.target.value).toISOString())}
                            />
                          </div>
                        </div>
                      ))}
                      {examCalendar.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">Pipeline Empty</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={saveProfile}
                    className="w-full py-3 bg-stone-900 border-b-4 border-stone-950 text-white rounded-xl font-bold text-xs uppercase hover:bg-stone-800 transition-all"
                  >
                    Apply Calibrations
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`${isEditingProfile ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
               <button 
                 onClick={() => setIsEditingAtmosphere(!isEditingAtmosphere)}
                 className="absolute -top-3 -right-3 p-2 bg-white rounded-full border shadow-sm hover:border-[#fbbf24] z-10"
               >
                 <Settings className="w-3.5 h-3.5 text-stone-400" />
               </button>

               <AnimatePresence>
                 {isEditingAtmosphere && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute top-12 right-0 w-64 bg-white p-6 rounded-3xl border shadow-2xl z-20 space-y-4 text-left"
                   >
                     <h4 className="text-xs font-black uppercase tracking-widest text-[#fbbf24]">Meteorological Data Override</h4>
                     <div className="space-y-3">
                       {Object.keys(weatherData).map((key) => (
                         <div key={key} className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400">{key}</label>
                           <input 
                             value={weatherData[key as keyof typeof weatherData]}
                             onChange={(e) => setWeatherData({...weatherData, [key]: e.target.value})}
                             className="w-full bg-stone-50 border rounded-lg px-2 py-1 text-xs font-bold"
                           />
                         </div>
                       ))}
                     </div>
                     <button 
                       onClick={() => setIsEditingAtmosphere(false)}
                       className="w-full py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase"
                     >
                       Save Meteorological State
                     </button>
                   </motion.div>
                 )}
               </AnimatePresence>

               {[
                 { icon: Sun, label: 'Room Target Temp', value: weatherData.temp, sub: 'Optimized 21.5°' },
                 { icon: Cloud, label: 'Sky Condition', value: weatherData.condition, sub: 'High Lux Premium' },
                 { icon: Zap, label: 'Static Humidity', value: weatherData.humidity, sub: 'Acoustic Damped' },
                 { icon: Moon, label: 'Evening Transition', value: weatherData.sunset, sub: 'Kelvin reset ' + weatherData.sunset },
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-[2rem] border shadow-sm flex items-center gap-4 group hover:border-[#fbbf24] transition-colors text-left">
                   <div className="bg-amber-50 p-3 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                     <stat.icon className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">{stat.label}</p>
                     <p className="text-base font-black text-stone-900 leading-none">{stat.value}</p>
                     <p className="text-[9px] text-[#fbbf24] font-black uppercase mt-1 leading-none">{stat.sub}</p>
                   </div>
                 </div>
               ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border shadow-md overflow-hidden text-left">
              <div className="p-8 border-b flex flex-col sm:flex-row items-center justify-between bg-stone-50/60 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#fbbf24] p-2.5 rounded-2xl">
                    <Sparkles className="w-5 h-5 text-stone-950" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 uppercase tracking-tight">Weather-Adaptive Calibrator</h3>
                    <p className="text-[#7c726a] text-xs font-medium">Calibrated circadian settings derived automatically</p>
                  </div>
                </div>
                <button 
                  onClick={generateBriefing}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:bg-stone-400 shadow-md border-b-4 border-stone-950 shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <RefreshCw className="w-4 h-4 text-emerald-400" />}
                  Align Atmospheric State
                </button>
              </div>

              <div className="p-10">
                {briefing ? (
                  <div className="prose prose-amber max-w-none">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           {briefing.split('###').filter(Boolean).map((section, idx) => {
                             const [title, ...content] = section.split('\n');
                             if (title.includes('Daily Briefing')) return null;
                             
                             return (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.1 }}
                                 key={idx} 
                                 className="space-y-2"
                               >
                                  <h4 className="text-amber-800 font-extrabold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                    {title.replace(/^\s+|\s+$/g, '')}
                                  </h4>
                                  <div className="text-xs sm:text-sm font-semibold text-stone-600 bg-stone-50 p-6 rounded-3xl border leading-relaxed">
                                    {content.join('\n').trim()}
                                  </div>
                               </motion.div>
                             )
                           })}
                        </div>
                        
                        <div className="space-y-8">
                          <div className="relative group text-left">
                            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-transparent to-amber-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative bg-stone-950 rounded-[2.5rem] p-8 text-stone-100 space-y-6 aspect-square flex flex-col justify-center overflow-hidden border border-white/10 shadow-2xl">
                               <div className="absolute top-0 right-0 p-8">
                                  <Lock className="w-12 h-12 text-[#fbbf24]/20" />
                               </div>
                               
                               <div className="space-y-2">
                                  <span className="text-[#fbbf24] font-black uppercase tracking-[0.2em] text-[10px]">Architectural Preview</span>
                                  <h4 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Spatial Sync Render</h4>
                               </div>
                               
                               <p className="text-stone-400 text-xs font-semibold leading-relaxed italic">
                                 "A minimalist, high-contrast config styled primarily with raw oak tables, active workspace lux balancing, and direct dual-display calibration."
                                </p>
                               
                               <button 
                                 onClick={onUpgrade}
                                 className="w-full py-4 bg-[#fbbf24] hover:bg-amber-500 text-stone-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn shadow-xl"
                               >
                                 Unlock 3D Simulator
                                 <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                               </button>

                               <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-stone-900 to-transparent pointer-events-none" />
                            </div>
                          </div>

                          <div className="bg-[#fef3c7] border border-[#fde68a] p-8 rounded-[2.5rem] space-y-3 text-left">
                             <div className="flex items-center gap-3">
                                <Trophy className="text-amber-800 w-5 h-5" />
                                <h5 className="font-black text-amber-900 uppercase tracking-widest text-[#92400e] text-xs">Calibration Impact Forecast</h5>
                             </div>
                             <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                               Completing these weather steps improves active project <span className="font-extrabold text-amber-950">lumens consistency by up to 18%</span>. Best-in-class performance standard.
                             </p>
                          </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-stone-50 rounded-[1.5rem] border flex items-center justify-center mx-auto shadow-inner">
                      <Loader2 className={`w-6 h-6 text-[#fbbf24] ${isGenerating ? 'animate-spin' : 'opacity-20'}`} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-stone-900 uppercase tracking-tight">Calibrator Idle</h4>
                      <p className="text-[#7c726a] text-xs font-medium max-w-sm mx-auto mt-2">Adjust practice profile and synchronize meteorological settings to activate advisor intelligence.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
