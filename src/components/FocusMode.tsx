import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Timer, 
  Volume2, 
  VolumeX, 
  Wind, 
  CloudRain, 
  TreePine, 
  Pause, 
  Play, 
  RefreshCw,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface FocusModeProps {
  onClose: () => void;
  userProfile?: any;
  onUpgrade?: () => void;
}

type SoundType = 'rain' | 'forest' | 'white-noise' | 'none';

const SOUNDS = {
  rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Note: Using placeholders, actual URLs would be better
  forest: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'white-noise': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
};

export function FocusMode({ onClose, userProfile, onUpgrade }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundType>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNotificationsBlocked, setIsNotificationsBlocked] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isCorporate = userProfile?.tier === 'corporate' || userProfile?.tier === 'elite' || userProfile?.hasInfiniteCredits || false;
  const isUnlocked = isCorporate || userProfile?.unlockedFocus || false;

  const handleFocusUnlock = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const credits = userProfile?.credits || 0;
    if (credits < 10) {
      if (onUpgrade) onUpgrade();
      setUnlockError("Not enough credits. Focus mode activation costs 10 credits.");
      return;
    }

    setUnlocking(true);
    setUnlockError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        credits: Math.max(0, credits - 10),
        unlockedFocus: true
      }, { merge: true });
    } catch (err: any) {
      setUnlockError("Failed to apply credit unlock deduction.");
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play ding sound logic here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }
    if (activeSound !== 'none') {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUNDS[activeSound as keyof typeof SOUNDS]);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = SOUNDS[activeSound as keyof typeof SOUNDS];
      }
      
      if (!isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSound, isMuted, isUnlocked]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isUnlocked) return;
    setIsActive(!isActive);
  }
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white overflow-y-auto"
    >
      {!isUnlocked && (
        <div className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-8">
          <div className="bg-amber-500 p-8 rounded-[3rem] shadow-2xl shadow-amber-500/20 ring-8 ring-amber-500/10">
            <Timer className="w-20 h-20 text-white animate-pulse" />
          </div>
          <div className="space-y-4 max-w-lg">
            <h2 className="text-5xl font-black tracking-tight">Focus Flow Activation</h2>
            <p className="text-gray-400 font-medium text-lg">
              Unlock distraction-free workspace environments with high-fidelity ambient soundscapes and bio-rhythm timers.
            </p>
            {unlockError && (
              <p className="text-red-400 text-sm font-semibold bg-red-900/20 px-4 py-2 rounded-xl mt-2 border border-red-500/25">
                {unlockError}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleFocusUnlock}
              disabled={unlocking}
              className="px-10 py-5 bg-amber-500 text-white rounded-2xl font-black text-xl hover:bg-amber-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {unlocking ? 'Authenticating...' : 'Unlock with 10 Credits'}
              <Sparkles className="w-6 h-6 text-white" />
            </button>
            
            <button 
              onClick={onUpgrade}
              className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-stone-100 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
            >
              Go Corporate
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all text-gray-300"
          >
            Return to Dashboard
          </button>
        </div>
      )}
      {/* Background Ambience Simulation (Animated Gradients) */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${!isUnlocked ? 'opacity-10' : ''}`}>
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br transition-all duration-1000 opacity-20 ${
          activeSound === 'rain' ? 'from-blue-900 via-gray-900 to-black' :
          activeSound === 'forest' ? 'from-green-900 via-gray-900 to-black' :
          'from-amber-900/40 via-gray-900 to-black'
        }`} />
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-2xl w-full flex flex-col items-center space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-3 text-amber-500 font-black uppercase tracking-[0.2em] text-sm"
          >
            <Timer className="w-4 h-4" />
            Focus Session Active
          </motion.div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter">Stay in the Zone.</h2>
        </div>

        {/* Timer Circle */}
        <div className="relative group cursor-pointer" onClick={toggleTimer}>
          <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white/10 flex flex-col items-center justify-center space-y-2 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <motion.div 
              className="absolute inset-0 bg-amber-500/10"
              initial={{ height: '0%' }}
              animate={{ height: `${(timeLeft / (25 * 60)) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
            <span className="text-6xl sm:text-8xl font-black font-mono relative z-10 transition-transform group-hover:scale-105">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest relative z-10">
              {isActive ? 'Click to Pause' : 'Click to Resume'}
            </span>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); resetTimer(); }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Selection */}
        <div className="w-full max-w-lg bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-500" />
              Ambient Atmosphere
            </h3>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { id: 'none', icon: Wind, label: 'Pure' },
              { id: 'rain', icon: CloudRain, label: 'Rain' },
              { id: 'forest', icon: TreePine, label: 'Forest' },
              { id: 'white-noise', icon: Wind, label: 'Noise' },
            ].map((sound) => (
              <button
                key={sound.id}
                onClick={() => setActiveSound(sound.id as SoundType)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border ${
                  activeSound === sound.id 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <sound.icon className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">{sound.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Settings */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            {isNotificationsBlocked ? (
              <BellOff className="w-5 h-5 text-amber-500" />
            ) : (
              <Bell className="w-5 h-5 text-white/40" />
            )}
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Notifications</p>
              <button 
                onClick={() => setIsNotificationsBlocked(!isNotificationsBlocked)}
                className="text-xs font-bold hover:text-amber-500 transition-colors"
              >
                {isNotificationsBlocked ? 'Blocking Active' : 'Allowing Alerts'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            <Maximize2 className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Full App View</p>
              <button className="text-xs font-bold hover:text-amber-500 transition-colors">Enabled</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
