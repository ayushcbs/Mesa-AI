import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Volume2, 
  Sliders, 
  Sparkles, 
  Mic, 
  MicOff, 
  ShieldCheck, 
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  Loader2,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateGeminiContent } from '../lib/gemini';

interface SmartEnvironmentHubProps {
  userProfile?: any;
  onUpgrade?: () => void;
  onLightingChange?: (brightness: number, colorTemp: number) => void;
}

// Map Kelvin temperature to friendly name and a display color
const KELVIN_PRESETS = [
  { temp: 2700, label: 'Candlelight (2700K)', border: 'border-orange-200', bg: 'bg-orange-500/10', text: 'text-orange-600' },
  { temp: 4000, label: 'Warm White (4000K)', border: 'border-amber-200', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  { temp: 5000, label: 'Natural Light (5000K)', border: 'border-yellow-200', bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  { temp: 6500, label: 'Cool Daylight (6500K)', border: 'border-blue-200', bg: 'bg-blue-500/10', text: 'text-blue-600' }
];

export function SmartEnvironmentHub({ userProfile, onUpgrade, onLightingChange }: SmartEnvironmentHubProps) {
  // --- STATE FOR LIGHTING ---
  const [brightness, setBrightness] = useState(70); // 0-100%
  const [colorTemp, setColorTemp] = useState(4000);   // 2700K - 6500K
  const [activePreset, setActivePreset] = useState<'focus' | 'relax' | 'custom'>('custom');

  // --- STATE FOR NOISE ---
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [dbLevel, setDbLevel] = useState(38); // Baseline DB
  const [activeNoiseProfile, setActiveNoiseProfile] = useState<'quiet' | 'coffee' | 'street'>('quiet');
  
  // AI Advice state
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Audio Context Ref for true monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Propagate lighting changes to parent
  useEffect(() => {
    if (onLightingChange) {
      onLightingChange(brightness, colorTemp);
    }
  }, [brightness, colorTemp, onLightingChange]);

  // Lighting preset selectors
  const applyPreset = (preset: 'focus' | 'relax') => {
    setActivePreset(preset);
    if (preset === 'focus') {
      setBrightness(100);
      setColorTemp(6500);
    } else {
      setBrightness(30);
      setColorTemp(2700);
    }
  };

  // Noise simulation when not using real mic
  useEffect(() => {
    if (isMonitoring && (micDenied || !navigator.mediaDevices)) {
      // Run noise simulation
      const interval = setInterval(() => {
        setDbLevel((prev) => {
          let base = 35;
          if (activeNoiseProfile === 'coffee') base = 58;
          if (activeNoiseProfile === 'street') base = 74;
          
          let drift = Math.sin(Date.now() / 1500) * 3 + (Math.random() - 0.5) * 4;
          return Math.max(25, Math.min(110, Math.round(base + drift)));
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, micDenied, activeNoiseProfile]);

  // Audio Processing Loop for Real Mic
  const startRealMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      microphoneRef.current = source;

      setMicDenied(false);
      setIsMonitoring(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawAndAnalyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate simple volume metric (RMS style / Average amplitude)
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const average = total / bufferLength;
        
        // Convert average to pseudo-decibels (30dB minimum up to 95dB)
        const pseudoDb = Math.round(30 + (average / 255) * 65);
        setDbLevel(pseudoDb);

        // Draw frequency bar visualizer
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              barHeight = (dataArray[i] / 255) * height * 0.8;
              
              // Gradient styling
              const grad = ctx.createLinearGradient(0, height, 0, 0);
              grad.addColorStop(0, '#f59e0b'); // amber
              grad.addColorStop(0.5, '#f97316'); // orange
              grad.addColorStop(1, '#ef4444'); // red

              ctx.fillStyle = grad;
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

              x += barWidth;
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(drawAndAnalyze);
      };

      drawAndAnalyze();
    } catch (err) {
      console.warn("Microphone access denied or unavailable in sandbox, falling back to simulation.", err);
      setMicDenied(true);
      setIsMonitoring(true);
    }
  };

  const stopRealMonitoring = () => {
    setIsMonitoring(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopRealMonitoring();
    } else {
      startRealMonitoring();
    }
  };

  // Retrieve ambient light color representing the slider values
  const getAmbientLightColorStyle = () => {
    // Basic temperature color map
    let color = '254, 240, 138'; // natural soft yellow
    if (colorTemp < 3200) {
      color = '251, 146, 60'; // Candle / warm sunset
    } else if (colorTemp < 4500) {
      color = '253, 186, 116'; // soft light orange warm
    } else if (colorTemp < 5500) {
      color = '254, 240, 138'; // natural white yellow
    } else {
      color = '186, 230, 253'; // cool daylight blue
    }
    return {
      background: `radial-gradient(circle, rgba(${color}, ${brightness / 100}) 0%, rgba(${color}, 0) 70%)`
    };
  };

  // Fetch real-time AI Advice for ambient noise and lighting configuration
  const fetchNoiseAdvice = async () => {
    setLoadingAdvice(true);
    setAiAdvice(null);
    try {
      const prompt = `
        ROLE: High-Performance Ergonomics & Focus Advisor.
        
        SITUATION:
        The student is studying with the following environment variables:
        - Current Ambient Noise Level: ${dbLevel} Decibels (dB). 
        - Active environment profile: ${micDenied ? activeNoiseProfile : 'Real mic monitoring'}.
        - Lighting Setting: Brightness ${brightness}%, Color Temperature ${colorTemp}K.
        
        TASK:
        Provide real-time feedback and highly actionable noise reduction, soundproofing, and focus management strategies to enhance concentration. Keep suggestions specific to this decibel level!
        Format using Markdown:
        - Use ## for a strong title
        - Provide immediate feedback on whether their current light and noise level is suitable for focus
        - List exactly 3 physical or behavioral methods for managing noise in this workspace
        - Suggest an ideal focus sound profile (audio masking, brown noise, passive isolation)
        - Be direct, elegant, and professional. Avoid fluffy intro/outro.
      `;

      const text = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        fallbackText: "### Acoustic Calibration & Focus Strategy\n1. **Apply Sound Absorption**: Place acoustic felt mat under keyboard to eliminate surface vibrations.\n2. **Audio Masking**: Enable brown noise or rain ambiance at 40-45dB to elevate speech masking threshold.\n3. **Circadian Lighting**: Set workspace lamp to 4000K daylight balance at 80% brightness for high cognitive focus."
      });

      setAiAdvice(text);
    } catch (err) {
      console.error("Failed to generate noise advice:", err);
      setAiAdvice("### Local Mitigation Guidelines\n1. **Use Passive Sound Barriers**: Close windows or doors facing noise sources.\n2. **Apply Audio Masking**: Since the AI couldn't be reached, consider playing steady rain sounds at 40dB to raise the masking threshold.\n3. **Optimize Natural Light**: Position desk parallel to daylight windows to mitigate glare while working.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Simple category classification of noise levels
  const getNoiseStatus = () => {
    if (dbLevel < 40) return { title: 'Deep Concentration Zone', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Optimal ambient state' };
    if (dbLevel < 55) return { title: 'Moderate Activity', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Safe for general reading' };
    if (dbLevel < 70) return { title: 'Active Distraction Risk', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', desc: 'Cognitive load increased' };
    return { title: 'High Concentration Barrier', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', desc: 'Critical soundproofing required' };
  };

  const noiseStatus = getNoiseStatus();

  return (
    <div id="smart-environment-hub" className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-6 sm:p-10 space-y-10 relative overflow-hidden">
      {/* Visual lighting aura background effect */}
      <div 
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60 mix-blend-screen"
        style={getAmbientLightColorStyle()}
      />

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
            <Sliders className="w-4 h-4" />
            Workspace Calibration
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Environmental Control Center</h3>
        </div>
        
        {/* Presets in header */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => applyPreset('focus')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePreset === 'focus' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Focus Preset
          </button>
          <button 
            onClick={() => applyPreset('relax')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePreset === 'relax' 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Relax Preset
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* LEFT COLUMN: LIGHTING MODULE */}
        <section className="bg-gray-50/60 p-6 sm:p-8 rounded-[2rem] border border-gray-100 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              Dynamic Lighting Controller
            </h4>
            <p className="text-xs text-gray-500">
              Customize illumination settings suitable to your circadian rhythm. Focus presets supply high-temp cognitive stimulation, whereas relaxing presets guard eyesight.
            </p>
          </div>

          {/* Interactive lighting demonstration card */}
          <div className="h-28 rounded-2xl relative overflow-hidden border border-gray-200 shadow-inner flex items-center justify-between p-6">
            <div 
              className="absolute inset-0 transition-all duration-700" 
              style={getAmbientLightColorStyle()}
            />
            <div className="relative z-10 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Aura Target</p>
              <h5 className="font-extrabold text-gray-800 text-sm">
                {colorTemp}K at {brightness}% Brightness
              </h5>
              <p className="text-[11px] text-gray-500 font-medium">
                {colorTemp >= 5500 ? '⚡ Maximum alertness active' : colorTemp >= 4000 ? '📖 Soft cognitive balance' : '🌅 Screen glare mitigation'}
              </p>
            </div>
            
            <div className="relative z-10 w-12 h-12 rounded-full border border-white/40 shadow-md flex items-center justify-center bg-white/10 backdrop-blur-md">
              <Sun 
                className={`w-6 h-6 text-yellow-500 transition-transform duration-[4000s]`}
                style={{ transform: `rotate(${(brightness / 100) * 360}deg)` }}
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Luminance Brightness</span>
                <span className="text-xs font-bold text-gray-900">{brightness}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={brightness}
                onChange={(e) => {
                  setBrightness(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg cursor-pointer transition-all"
              />
            </div>

            {/* Color Temp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Circadian Temperature</span>
                <span className="text-xs font-bold text-gray-900">{colorTemp}K</span>
              </div>
              <input 
                type="range" 
                min="2700" 
                max="6500" 
                step="50"
                value={colorTemp}
                onChange={(e) => {
                  setColorTemp(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg cursor-pointer transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-1">
                <span>Sunset (2700K)</span>
                <span>Daylight (6500K)</span>
              </div>
            </div>
          </div>

          {/* Kelvin Preset Chips */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Kelvin Benchmarks</span>
            <div className="grid grid-cols-2 gap-2">
              {KELVIN_PRESETS.map((pres) => (
                <button
                  key={pres.temp}
                  onClick={() => {
                    setColorTemp(pres.temp);
                    setActivePreset('custom');
                  }}
                  className={`px-3 py-2 border rounded-xl text-left text-xs font-semibold transition-all ${
                    colorTemp === pres.temp 
                      ? `${pres.border} ${pres.bg} ${pres.text} font-black ring-2 ring-amber-500/10` 
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pres.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AMBIENT NOISE MONITOR */}
        <section className="bg-gray-50/60 p-6 sm:p-8 rounded-[2rem] border border-gray-100 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-500" />
              Acoustic Noise Monitor
            </h4>
            <p className="text-xs text-gray-500">
              Listen to the acoustic atmosphere of your study environment in real time to guarantee sound isolation and protect active neural concentration bands.
            </p>
          </div>

          {/* Decibel Level Display Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${noiseStatus.bg} ${noiseStatus.color}`}>
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-gray-800 text-[13px]">{noiseStatus.title}</h5>
                  <p className="text-[10px] text-gray-400 font-medium">{noiseStatus.desc}</p>
                </div>
              </div>
              
              <button
                onClick={toggleMonitoring}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                  isMonitoring 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600' 
                    : 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600'
                }`}
              >
                {isMonitoring ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isMonitoring ? 'Stop Mic' : 'Listen Workspace'}
              </button>
            </div>

            {/* Gauge visualizer */}
            <div className="relative pt-2">
              <div className="flex items-end justify-between text-xs font-bold text-gray-500 pb-2">
                <span>0 dB</span>
                <span className="text-xl font-black text-gray-900 font-mono tracking-tight">{dbLevel} dB</span>
                <span>120 dB</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${
                    dbLevel < 40 ? 'bg-emerald-500' :
                    dbLevel < 55 ? 'bg-amber-500' :
                    dbLevel < 70 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (dbLevel / 120) * 100)}%` }}
                />
              </div>

              {/* Real mic dynamic wave canvas or simulation notification */}
              {isMonitoring && (
                <div className="mt-4 border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50/40">
                  {micDenied ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                          Simulation Fallback Active
                        </span>
                        <span className="text-[10px] uppercase font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Sandbox Mode</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'quiet', label: 'Library (35 dB)' },
                          { id: 'coffee', label: 'Cafe (58 dB)' },
                          { id: 'street', label: 'Street (75 dB)' }
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setActiveNoiseProfile(p.id as any)}
                            className={`py-1 bg-white border rounded-lg text-[10px] font-bold ${
                              activeNoiseProfile === p.id 
                                ? 'border-amber-500 text-amber-600 bg-amber-50/40 font-black' 
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-center">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Listening via WebAudio API</p>
                      <canvas ref={canvasRef} height="40" className="w-full bg-gray-950 rounded-lg shadow-inner" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Advice trigger */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Acoustic Advisory Suite</span>
              <button
                onClick={fetchNoiseAdvice}
                disabled={loadingAdvice}
                className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-200 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loadingAdvice ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                )}
                Ask AI Strategy
              </button>
            </div>

            {/* AI response display */}
            <AnimatePresence mode="wait">
              {aiAdvice ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 bg-gradient-to-br from-amber-50/50 to-amber-500/5 border border-amber-100/60 rounded-2xl space-y-3 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5" />
                      Ergonomics Advisor Response
                    </div>
                    <button 
                      onClick={() => setAiAdvice(null)} 
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="prose prose-amber max-w-none text-xs sm:text-sm text-gray-600 leading-relaxed max-h-[220px] overflow-y-auto pr-1">
                    <div className="whitespace-pre-line prose-headings:font-black prose-headings:text-amber-900 prose-headings:text-sm">
                      {aiAdvice}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-5 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-center bg-gray-50/30 text-gray-400 text-xs py-8">
                  <div className="space-y-2">
                    <Info className="w-6 h-6 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-500">Click "Ask AI Strategy" to analyze noise dynamics and formulate a soundproofing plan.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}
