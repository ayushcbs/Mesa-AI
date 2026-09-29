import React from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles,
  Zap,
  Sliders,
  Compass,
  Monitor,
  MessageSquare,
  Lock,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface CreditInfoModalProps {
  onClose: () => void;
  credits: number;
  onUpgrade: () => void;
}

export function CreditInfoModal({ onClose, credits, onUpgrade }: CreditInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#faf9f6] rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-2xl relative text-left"
      >
        {/* Decorative architectural grid lines */}
        <div className="absolute top-0 left-12 right-12 h-px bg-stone-200/60 pointer-events-none" />
        <div className="absolute inset-y-0 left-12 w-px bg-stone-200/30 pointer-events-none" />
        
        {/* Header Block */}
        <div className="bg-stone-900 text-stone-100 p-8 sm:p-10 relative overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <span className="text-[9px] uppercase tracking-[0.25em] font-black text-amber-500 font-mono">Operations Audit Directory</span>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#fbbf24] fill-[#fbbf24]" />
            Calibre Credit Ledger
          </h3>
          
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-stone-400 block tracking-wide">Allocated Credit Bank</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{credits} CR</span>
            </div>
            
            <button 
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-amber-500/20"
            >
              Acquire Credits
            </button>
          </div>
        </div>

        {/* Breakdown Body List */}
        <div className="p-8 sm:p-10 space-y-6 max-h-[420px] overflow-y-auto custom-scrollbar">
          <div className="border-b pb-3">
            <h4 className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none">Standardized Operational Rates</h4>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Calibrated for workspace computational and design-generation workloads.</p>
          </div>

          <div className="space-y-4 divide-y divide-stone-150">
            {/* Calibration / Personalization Feature unlock */}
            <div className="pt-0 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">Personalization Calibration Unlocks</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Configure desk physical bounds, circadian smart light fixtures, seat mechanics, or local comfort targeting.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-amber-500/10 text-amber-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                10 CR Each
              </span>
            </div>

            {/* AI 2D Layout */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">AI 2D Layout Redesign Outline</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Produce a flat 2D organized overhead schematic of your optimized desk and room boundaries.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-blue-500/10 text-blue-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                50 CR
              </span>
            </div>

            {/* AI 3D Simulation Render */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-[#f0fdf4] rounded-xl text-emerald-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">AI 3D Photorealistic Render</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Simulate high-fidelity architectural photorealistic 3D rendering of your customized workspace optimization.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-emerald-500/10 text-emerald-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                1000 CR
              </span>
            </div>

            {/* Weather advisory */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">Advisory meteorological sync</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Unlock long-term meteorology feeds and circadian light kelvin curves automatically maps to local sunset time.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-blue-500/10 text-blue-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                50 CR Unl
              </span>
            </div>

            {/* Spatial Scan */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">Physical Computer-Vision Scan</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Run alignment calculations, desk depth offsets, and screen elevation checks against original photo uploads.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-indigo-500/10 text-indigo-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                10 CR
              </span>
            </div>

            {/* AI Advisor live chat */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-stone-50 rounded-xl text-stone-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">Practitioner Advisor Live Chat</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Follow-up messaging with AI spatial analyst to adjust details, materials, or lighting lux setups.
                  </p>
                </div>
              </div>
              <span className="font-mono bg-stone-200 text-stone-700 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                1 CR
              </span>
            </div>

            {/* Workspace Evolution */}
            <div className="pt-4 flex justify-between gap-4 text-xs font-semibold">
              <div className="flex gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 h-10 w-10 flex items-center justify-center" />
                </div>
                <div>
                  <span className="font-extrabold uppercase text-stone-900 text-xs block">Workspace Evolution Fee</span>
                  <p className="text-[11px] text-[#7c726a] font-medium leading-relaxed mt-0.5">
                    Automated calibration telemetry and environment retention fee applied daily (unaffected by application activity).
                  </p>
                </div>
              </div>
              <span className="font-mono bg-rose-500/10 text-rose-800 px-3 py-1 rounded-lg font-black text-xs h-min mt-1 uppercase whitespace-nowrap">
                250 CR / Day
              </span>
            </div>
          </div>
          
          {/* Note Section */}
          <div className="p-4 bg-amber-500/15 border border-amber-500/20 rounded-[1.5rem] text-[11px] text-amber-900 font-semibold leading-relaxed">
            💡 **PRO PRACTITIONER NOTE**: Upgrade to an **Elite Studio License** to gain infinite access to all personalization calibration features and the Weather Advisor Suite without credit deductions!
          </div>
        </div>

        <div className="bg-stone-50 px-8 py-5 text-center border-t border-stone-200">
          <p className="text-[10px] tracking-wide text-stone-400 font-bold uppercase">
            Mesa spatial calibration directory v3.5 // Verified Corporate Ledgers
          </p>
        </div>
      </motion.div>
    </div>
  );
}
