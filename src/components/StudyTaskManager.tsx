import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Target, 
  Layers, 
  Filter, 
  Clock, 
  Flame, 
  Award, 
  Lightbulb, 
  ShieldCheck, 
  Check, 
  BookOpen, 
  Loader2,
  Edit3,
  Save,
  X
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
import { StudyTask, StudyProfile } from '../types';

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

interface StudyTaskManagerProps {
  user: any;
  activeProfile?: StudyProfile | null;
  profiles?: StudyProfile[];
  compact?: boolean;
  onTaskCompleted?: (taskText: string) => void;
  suggestedTasks?: string[];
}

export function StudyTaskManager({
  user,
  activeProfile,
  profiles = [],
  compact = false,
  onTaskCompleted,
  suggestedTasks = []
}: StudyTaskManagerProps) {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [category, setCategory] = useState<string>('Study Goal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(45);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [profileFilter, setProfileFilter] = useState<string>('active'); // 'active' | 'all'
  const [celebrationTask, setCelebrationTask] = useState<string | null>(null);

  // Inline editing state for task time
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editSpentMinutes, setEditSpentMinutes] = useState<number>(0);
  const [editEstMinutes, setEditEstMinutes] = useState<number>(45);

  // Firestore sync for tasks
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const tasksRef = collection(db, 'users', user.uid, 'goals');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const est = typeof data.estimatedDuration === 'number' && data.estimatedDuration > 0 ? data.estimatedDuration : 45;
        const spent = typeof data.timeSpent === 'number' 
          ? data.timeSpent 
          : (data.status === 'completed' ? est : 0);

        return {
          id: docSnap.id,
          text: data.text || '',
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          category: data.category || 'Study Goal',
          profileId: data.profileId || undefined,
          targetDate: data.targetDate || null,
          estimatedDuration: est,
          timeSpent: spent,
          createdAt: data.createdAt
        } as StudyTask;
      });
      setTasks(fetchedTasks);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/goals`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Add Task
  const handleAddTask = async (
    e?: React.FormEvent, 
    customText?: string, 
    customCategory?: string,
    customDuration?: number
  ) => {
    if (e) e.preventDefault();
    const textToSubmit = customText || newTaskText;
    if (!textToSubmit.trim() || !user) return;

    const estDurationToUse = customDuration || estimatedDuration || 45;

    const taskPayload = {
      text: textToSubmit.trim(),
      status: 'pending',
      priority,
      category: customCategory || category,
      profileId: activeProfile?.id || null,
      estimatedDuration: estDurationToUse,
      timeSpent: 0,
      createdAt: serverTimestamp()
    };

    // Optimistic update
    const tempId = 'temp-' + Date.now();
    setTasks(prev => [{
      id: tempId,
      text: taskPayload.text,
      status: 'pending',
      priority: taskPayload.priority,
      category: taskPayload.category,
      profileId: activeProfile?.id,
      estimatedDuration: estDurationToUse,
      timeSpent: 0,
      createdAt: new Date()
    }, ...prev]);

    if (!customText) setNewTaskText('');

    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), taskPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/goals`);
    }
  };

  // Handle Toggle Task Status
  const handleToggleStatus = async (task: StudyTask) => {
    if (!user) return;
    const isNowCompleted = task.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'pending';
    const est = task.estimatedDuration || 45;
    const newTimeSpent = isNowCompleted && (task.timeSpent || 0) < est ? est : (task.timeSpent || 0);

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, timeSpent: newTimeSpent } : t));

    if (newStatus === 'completed') {
      setCelebrationTask(task.text);
      if (onTaskCompleted) onTaskCompleted(task.text);
      setTimeout(() => setCelebrationTask(null), 3000);
    }

    try {
      const taskDocRef = doc(db, 'users', user.uid, 'goals', task.id);
      await updateDoc(taskDocRef, { 
        status: newStatus,
        timeSpent: newTimeSpent
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/goals/${task.id}`);
    }
  };

  // Handle Quick Time Spent Logging (+15m, +30m, -15m)
  const handleQuickLogTime = async (task: StudyTask, deltaMinutes: number) => {
    if (!user) return;
    const est = task.estimatedDuration || 45;
    const currentSpent = task.timeSpent || 0;
    const newSpent = Math.max(0, currentSpent + deltaMinutes);

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, timeSpent: newSpent } : t));

    try {
      const taskDocRef = doc(db, 'users', user.uid, 'goals', task.id);
      await updateDoc(taskDocRef, { timeSpent: newSpent });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/goals/${task.id}`);
    }
  };

  // Handle Save Time and Duration from Inline Editor
  const handleSaveDurationEdit = async (taskId: string) => {
    if (!user) return;
    const cleanSpent = Math.max(0, Number(editSpentMinutes) || 0);
    const cleanEst = Math.max(5, Number(editEstMinutes) || 45);

    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      timeSpent: cleanSpent, 
      estimatedDuration: cleanEst 
    } : t));

    setEditingTaskId(null);

    try {
      const taskDocRef = doc(db, 'users', user.uid, 'goals', taskId);
      await updateDoc(taskDocRef, { 
        timeSpent: cleanSpent,
        estimatedDuration: cleanEst
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/goals/${taskId}`);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const taskDocRef = doc(db, 'users', user.uid, 'goals', taskId);
      await deleteDoc(taskDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/goals/${taskId}`);
    }
  };

  // Filtering
  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending' && t.status !== 'pending') return false;
    if (filter === 'completed' && t.status !== 'completed') return false;
    if (profileFilter === 'active' && activeProfile && t.profileId && t.profileId !== activeProfile.id) {
      return false;
    }
    return true;
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categories = [
    'Study Goal',
    'Ergonomics & Space',
    'Exam Prep',
    'Assignment',
    'Wellness'
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const quickSuggestions = [
    { text: 'Review 25-page chapter notes', category: 'Study Goal', duration: 45 },
    { text: 'Adjust desk chair height to 90° elbow bend', category: 'Ergonomics & Space', duration: 15 },
    { text: 'Calibrate warm 4000K lighting for evening session', category: 'Ergonomics & Space', duration: 15 },
    { text: 'Complete 45-min Pomodoro focus cycle', category: 'Study Goal', duration: 45 },
    { text: 'Drink 500ml water and 5-min standing stretch', category: 'Wellness', duration: 10 }
  ];

  return (
    <div className={`bg-white rounded-[2.5rem] border border-stone-200/80 shadow-md overflow-hidden flex flex-col ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-stone-900 text-base uppercase tracking-tight">
                Study Tasks & Objectives
              </h3>
              {activeProfile && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                  {activeProfile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-medium">
              Track task completion, time spent, and estimated session duration
            </p>
          </div>
        </div>

        {/* Overall Tasks Done Metric */}
        <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200/80">
          <div className="text-right">
            <span className="text-base font-black text-amber-600 font-mono leading-none block">
              {progressPercent}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              {completedCount}/{totalCount} Done
            </span>
          </div>
          <div className="w-12 h-2 bg-stone-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Task Creation Form */}
      <form onSubmit={(e) => handleAddTask(e)} className="mt-5 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add new study task or ergonomic action..."
            className="flex-grow bg-[#fcfbf9] border border-stone-200 rounded-2xl px-4 py-3 text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>

        {/* Duration, Categories & Priority Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Estimated Duration selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              Est. Time:
            </span>
            {durationOptions.map(mins => (
              <button
                type="button"
                key={mins}
                onClick={() => setEstimatedDuration(mins)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                  estimatedDuration === mins
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">Priority:</span>
            {(['low', 'medium', 'high'] as const).map(p => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                  priority === p 
                    ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">Tag:</span>
          {categories.map(cat => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                category === cat
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>

      {/* Suggested Quick Add Actions */}
      {(suggestedTasks.length > 0 || quickSuggestions.length > 0) && tasks.length < 5 && (
        <div className="mt-4 p-3 bg-amber-500/5 rounded-2xl border border-amber-200/50 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-800">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Suggested Action Items
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(suggestedTasks.length > 0 ? suggestedTasks.slice(0, 3).map(t => ({ text: t, category: 'Ergonomics & Space', duration: 25 })) : quickSuggestions.slice(0, 3)).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddTask(undefined, item.text, item.category, item.duration)}
                className="text-[10px] font-semibold bg-white hover:bg-amber-100/60 border border-amber-200/80 text-stone-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-left"
              >
                <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate max-w-[170px]">{item.text}</span>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60 shrink-0">
                  {item.duration}m
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-5 pt-4 border-t border-stone-100">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-all ${
                filter === f ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {activeProfile && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500">
            <button
              onClick={() => setProfileFilter(prev => prev === 'active' ? 'all' : 'active')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                profileFilter === 'active'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}
            >
              {profileFilter === 'active' ? `Filtered by ${activeProfile.name}` : 'Showing All Profiles'}
            </button>
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-wider">Syncing tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-stone-200 rounded-2xl space-y-2 text-stone-400">
            <Calendar className="w-8 h-8 mx-auto opacity-30 text-stone-400" />
            <p className="text-xs font-bold text-stone-600">No tasks in this view</p>
            <p className="text-[11px] text-stone-400">Add a study goal or ergonomic adjustment above to begin tracking.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredTasks.map(task => {
              const isCompleted = task.status === 'completed';
              const est = task.estimatedDuration || 45;
              const spent = task.timeSpent !== undefined ? task.timeSpent : (isCompleted ? est : 0);
              
              // Percentage calculation based on time spent vs estimated duration
              const calculatedPct = est > 0 ? Math.round((spent / est) * 100) : 0;
              const progressPct = isCompleted ? 100 : Math.min(100, calculatedPct);

              const isEditing = editingTaskId === task.id;

              const priorityColor = 
                task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                task.priority === 'low' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isCompleted 
                      ? 'bg-stone-50/70 border-stone-200/60 opacity-75' 
                      : 'bg-[#faf9f6] border-stone-200/80 hover:bg-white hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  {/* Top Task Header: Checkbox, Text, Tags, and Delete */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-0.5 transition-transform active:scale-90 shrink-0 ${
                        isCompleted ? 'text-emerald-500' : 'text-stone-300 hover:text-amber-500'
                      }`}
                      title={isCompleted ? "Mark as pending" : "Mark as complete"}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-50 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-grow min-w-0">
                      <p className={`text-xs font-semibold leading-relaxed transition-all ${
                        isCompleted ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}>
                        {task.text}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {task.category && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-200/70 text-stone-600 px-2 py-0.5 rounded-md">
                            {task.category}
                          </span>
                        )}
                        {task.priority && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${priorityColor}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingTaskId(null);
                          } else {
                            setEditingTaskId(task.id);
                            setEditSpentMinutes(spent);
                            setEditEstMinutes(est);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isEditing 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100 opacity-70 group-hover:opacity-100'
                        }`}
                        title="Edit time spent and estimated duration"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* VISUAL PROGRESS BAR & DURATION SECTION */}
                  <div className="mt-0.5 pt-2 border-t border-stone-200/60">
                    {/* Time details & percentage label */}
                    <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Clock className={`w-3 h-3 ${isCompleted ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <span>
                          {formatDuration(spent)} / {formatDuration(est)}
                        </span>
                        <span className="text-stone-400 font-normal hidden sm:inline">
                          ({spent}m of {est}m spent)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold ${
                          isCompleted 
                            ? 'text-emerald-600' 
                            : progressPct >= 100 
                              ? 'text-emerald-600' 
                              : progressPct > 0 
                                ? 'text-amber-600' 
                                : 'text-stone-400'
                        }`}>
                          {progressPct}%
                        </span>
                        {isCompleted ? (
                          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                            Completed
                          </span>
                        ) : calculatedPct > 100 ? (
                          <span className="text-[8px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                            +Overtime
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Progress Track & Visual Bar */}
                    <div className="relative w-full h-2 bg-stone-200/70 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className={`h-full rounded-full transition-all ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : progressPct >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : progressPct > 0
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-stone-300'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Inline Editor or Quick Time Log Buttons */}
                    {isEditing ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2.5 p-2 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 font-medium">Spent:</span>
                            <input
                              type="number"
                              min="0"
                              value={editSpentMinutes}
                              onChange={(e) => setEditSpentMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-14 px-1.5 py-0.5 bg-stone-50 border border-stone-200 rounded font-mono font-bold text-stone-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-stone-400">m</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 font-medium">Est:</span>
                            <input
                              type="number"
                              min="5"
                              value={editEstMinutes}
                              onChange={(e) => setEditEstMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                              className="w-14 px-1.5 py-0.5 bg-stone-50 border border-stone-200 rounded font-mono font-bold text-stone-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-stone-400">m</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveDurationEdit(task.id)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Quick Log Buttons */
                      <div className="flex items-center justify-between mt-2 text-[9px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-stone-400 font-medium">Quick Log:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickLogTime(task, 15)}
                            className="px-1.5 py-0.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-600 rounded font-bold transition-colors cursor-pointer border border-stone-200/70"
                            title="Add 15 minutes spent"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickLogTime(task, 30)}
                            className="px-1.5 py-0.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-600 rounded font-bold transition-colors cursor-pointer border border-stone-200/70"
                            title="Add 30 minutes spent"
                          >
                            +30m
                          </button>
                          {spent > 0 && (
                            <button
                              type="button"
                              onClick={() => handleQuickLogTime(task, -15)}
                              className="px-1.5 py-0.5 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-400 hover:border-red-200 rounded font-bold transition-colors cursor-pointer border border-stone-200/70"
                              title="Subtract 15 minutes"
                            >
                              -15m
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditSpentMinutes(spent);
                            setEditEstMinutes(est);
                          }}
                          className="text-stone-400 hover:text-amber-600 text-[9px] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Custom Time
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Celebration Alert */}
      <AnimatePresence>
        {celebrationTask && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2.5 shadow-sm"
          >
            <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <strong className="font-black uppercase tracking-wider">Goal Completed!</strong>
              <p className="text-[11px] text-emerald-700 truncate max-w-xs">{celebrationTask}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
