import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Target, 
  Trophy, 
  Calendar,
  Sparkles,
  Loader2,
  Lock
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Goal {
  id: string;
  text: string;
  status: 'pending' | 'completed';
  createdAt: any;
  targetDate?: any;
}

interface GoalTrackerProps {
  userProfile?: any;
  onUpgrade?: () => void;
}

export function GoalTracker({ userProfile, onUpgrade }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedGoalText, setCompletedGoalText] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const q = query(goalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(items);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/goals`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !user) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        text: newGoal,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setNewGoal('');
    } catch (err) {
      console.error("Error adding goal:", err);
    }
  };

  const toggleGoalStatus = async (goal: Goal) => {
    if (!user) return;
    const goalRef = doc(db, 'users', user.uid, 'goals', goal.id);
    const newStatus = goal.status === 'pending' ? 'completed' : 'pending';
    
    try {
      await updateDoc(goalRef, { status: newStatus });
      if (newStatus === 'completed') {
        setCompletedGoalText(goal.text);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (err) {
      console.error("Error updating goal:", err);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  const completedCount = goals.filter(g => g.status === 'completed').length;
  const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  return (
    <div className="relative">
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col overflow-hidden">
        <div className="p-8 bg-amber-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-none">Goal Tracker</h3>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mt-1">Focus on progress</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-amber-600 font-mono">{Math.round(progress)}%</span>
            <p className="text-[10px] font-black uppercase text-gray-400">Completion</p>
          </div>
        </div>

        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-8 space-y-6 flex-grow">
        <form onSubmit={addGoal} className="flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="New study goal..."
            className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
          />
          <button 
            type="submit"
            className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        <div className="space-y-3 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Goals</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-center space-y-3">
              <Calendar className="w-12 h-12 opacity-20" />
              <div>
                <p className="text-sm font-bold text-gray-600">No goals set yet.</p>
                <p className="text-xs">Define your target to start tracking.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`group p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                    goal.status === 'completed' 
                      ? 'bg-gray-50 border-transparent opacity-60' 
                      : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-md'
                  }`}
                >
                  <button 
                    onClick={() => toggleGoalStatus(goal)}
                    className={`transition-colors ${goal.status === 'completed' ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                  >
                    {goal.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  
                  <span className={`flex-grow text-sm font-medium ${goal.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {goal.text}
                  </span>

                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {completedCount > 0 && goals.every(g => g.status === 'completed') && goals.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-5 h-5 fill-current" />
            <span className="text-sm font-black uppercase tracking-widest">Mastery Achieved</span>
          </div>
          <p className="text-xs font-bold text-amber-100">All current study goals have been completed!</p>
        </div>
      )}

      {/* Celebration Toast */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] bg-amber-900 border-2 border-amber-500 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4"
          >
            <div className="bg-amber-500 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">Goal Smashed!</p>
              <p className="text-sm font-bold">"{completedGoalText}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
