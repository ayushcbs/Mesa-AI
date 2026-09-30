import React, { useState } from 'react';
import { 
  LogIn, 
  Sparkles, 
  Layers, 
  Compass, 
  Camera, 
  BookOpen, 
  Briefcase, 
  ArrowRight,
  ShieldCheck, 
  Zap, 
  Gauge, 
  Grid, 
  Sliders, 
  Volume2, 
  Award,
  BarChart3,
  CheckCircle2,
  Heart,
  Lock,
  Workflow,
  Users,
  Palette,
  Ruler
} from 'lucide-react';

export function LandingPage({ onLogin, error }: { onLogin: () => void; error?: string | null }) {
  const [activeTab, setActiveTab] = useState<'designers' | 'studios' | 'academics'>('designers');

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-sans selection:bg-stone-200 flex flex-col items-center">
      {error && (
        <div role="alert" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800 shadow-lg">
          {error}
        </div>
      )}
      {/* Premium Header */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between border-b border-stone-200/60 sticky top-0 bg-[#faf9f6]/95 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="bg-stone-900 p-2.5 rounded-2xl shadow-xl shadow-stone-950/10">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black uppercase tracking-[0.2em] text-stone-900">Mesa</span>
            <span className="text-[10px] block font-semibold text-stone-400 -mt-1 uppercase tracking-[0.15em]">Interior Design Launchpad</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-[#57534e]">
          <a href="#diagnostics" className="hover:text-stone-900 transition-colors">Spatial Diagnostics</a>
          <a href="#workflows" className="hover:text-stone-900 transition-colors font-medium">Design Workflows</a>
          <a href="#pricing" className="hover:text-stone-900 transition-colors">Structured Payment Plans</a>
        </div>

        <button 
          onClick={onLogin}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4 text-emerald-400" />
          Launch Studio Console
        </button>
      </header>

      {/* Hero Section */}
      <section className="text-center px-4 sm:px-6 max-w-5xl py-16 sm:py-28 space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-stone-100 text-[#44403c] rounded-full text-[11px] font-bold tracking-wider uppercase border border-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Workspace Intelligence 3.5 Engine
        </div>

        <h1 className="text-5xl font-black tracking-tight text-[#1c1917] sm:text-7xl leading-[1.05] max-w-4xl mx-auto">
          The Workspace Intelligence <span className="font-serif italic font-normal text-stone-500">Platform</span> for Interior Designers.
        </h1>

        <p className="text-lg sm:text-xl text-[#57534e] leading-relaxed max-w-3xl mx-auto font-medium">
          Elevate your spatial concepts. Mesa equips interior designers, space planners, and academic studios with computer-vision desk diagnostics, real-time acoustics tracking, biophilic recommendations, and AI-powered 3D redesigns.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLogin}
            className="group flex items-center gap-3 px-8 py-4.5 bg-stone-900 text-stone-100 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#292524] transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-emerald-400 group-hover:rotate-6 transition-transform" />
            Launch Studio Console
          </button>
          
          <a
            href="#diagnostics"
            className="px-8 py-4.5 bg-white text-stone-700 border border-stone-200 rounded-2xl font-bold text-sm tracking-wide hover:bg-stone-50 transition-all flex items-center gap-2 hover:border-stone-400"
          >
            Explore Spatial Diagnostics
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </a>
        </div>

        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest pt-2">
          Secure, direct sign-in with Google Authentication API
        </p>
      </section>

      {/* Spatial Calibration Showcase */}
      <section id="diagnostics" className="w-full max-w-7xl px-6 py-12">
        <div className="bg-stone-900 text-stone-100 rounded-[3rem] p-8 sm:p-16 relative overflow-hidden shadow-2xl border-4 border-stone-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-stone-700/20 opacity-40 blur-[120px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 bg-stone-800 px-3.5 py-1.5 rounded-lg border border-stone-700">
                Lumen & Ergonomic Analysis
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Deep COMPUTER-VISION room auditing.
              </h2>
              <p className="text-[#a8a29e] leading-relaxed text-sm sm:text-base">
                Upload room photographs directly inside client design projects. Mesa detects physical strain risks, monitor height misalignment, clutter saturation, and biophilic deficiencies using visual tensors to score and produce customized studio layout adjustments.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-200 font-bold text-xs uppercase">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Lighting & Kelvin
                  </div>
                  <p className="text-xs text-stone-400">Circadian tuning matches light output with local atmospheric conditions.</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-200 font-bold text-xs uppercase">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    Acoustic Baseline
                  </div>
                  <p className="text-xs text-stone-400">Micro-monitoring shields client concentration and noise levels.</p>
                </div>
              </div>
            </div>

            {/* Simulated AI Scan UI Box */}
            <div className="bg-stone-950/80 p-6 rounded-[2.5rem] border border-stone-800/80 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">LIVE SCAN // DESIGN STUDIO R-049</span>
                </div>
                <span className="text-xs font-mono font-black text-amber-400">92.4% CALIBRE</span>
              </div>
              
              <div className="space-y-4 text-xs font-mono">
                <div className="flex justify-between items-center text-stone-300">
                  <span>[S-01] Desktop Height Ratio</span>
                  <span className="text-emerald-400">72cm OPTIMAL</span>
                </div>
                <div className="flex justify-between items-center text-stone-300">
                  <span>[S-02] Monitor Angle Deficit</span>
                  <span className="text-[#f43f5e] font-black">Strain Risk (14° slope)</span>
                </div>
                <div className="flex justify-between items-center text-stone-300">
                  <span>[S-03] Lux Illuminance Level</span>
                  <span className="text-amber-400">320lm (Insufficient light)</span>
                </div>
                <div className="flex justify-between items-center text-stone-300">
                  <span>[S-04] Biophilic Density</span>
                  <span className="text-[#f43f5e] font-black">Nil plants (0.0 Index)</span>
                </div>
              </div>

              <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800">
                <p className="text-[#a8a29e] text-xs leading-relaxed italic">
                  "Relocate secondary monitor 11–13cm higher to reduce neck strain. Shift desk parallel to natural light windows to eliminate afternoon display glare and maximize productivity."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Segments Tab Section */}
      <section id="workflows" className="w-full max-w-7xl px-6 py-16 text-center space-y-12">
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-[0.2em]">Tailored For Interior Spatial Design</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1c1917] tracking-tight">How interior designers leverage Mesa.</h2>
          <p className="text-stone-500 font-medium max-w-2xl mx-auto text-sm sm:text-base">Select your practice model to view tailored room customization and client presentation workflows.</p>
        </div>

        {/* Custom Tab selectors */}
        <div className="inline-flex flex-wrap justify-center gap-3 bg-stone-200/60 p-3 rounded-2xl border border-stone-300">
          {[
            { id: 'designers', label: 'Interior Designers & Decorators' },
            { id: 'studios', label: 'Design Studios & Firms' },
            { id: 'academics', label: 'Academic & Research Workspaces' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-10 py-4.5 rounded-xl text-base md:text-lg font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-stone-900 text-stone-100 shadow-xl scale-102 font-black' 
                  : 'text-stone-600 hover:text-stone-900 bg-transparent hover:bg-stone-200/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-6">
          {activeTab === 'designers' && [
            { icon: Palette, title: "Client Portfolios & Briefs", desc: "Keep track of multiple client spaces and room layouts. Generate custom PDF briefs with branding and spatial indices." },
            { icon: BarChart3, title: "Biomechanical & Aesthetic Scores", desc: "Generate expert scores (0-100) detailing physical ergonomic strain, seating efficiency, clutter density, and lighting balance." },
            { icon: ShieldCheck, title: "Colleague Invitations & Tasks", desc: "Invite colleagues via email to collaborate directly on client projects with assigned tasks and feedback." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="bg-stone-100 w-12 h-12 rounded-2xl flex items-center justify-center text-stone-900">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">{item.title}</h3>
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-semibold">{item.desc}</p>
            </div>
          ))}

          {activeTab === 'studios' && [
            { icon: Zap, title: "3D Spatial AI Redesign", desc: "Modify layouts programmatically. Render high-resolution 2D and 3D visual concepts tailored to client requirements." },
            { icon: Sliders, title: "Acoustic & Circadian Lighting", desc: "Calibrate studio lux levels and acoustic absorption arrays for optimal living and work atmosphere." },
            { icon: Ruler, title: "Executive Presentation Briefs", desc: "Examine room dimensions and furniture placement using visual tensor diagnostics. Export branded reports effortlessly." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="bg-stone-100 w-12 h-12 rounded-2xl flex items-center justify-center text-stone-900">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">{item.title}</h3>
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-semibold">{item.desc}</p>
            </div>
          ))}

          {activeTab === 'academics' && [
            { icon: BookOpen, title: "Academic Spatial Audits", desc: "Audit campus libraries, study pods, and research labs with standardized ergonomic metrics." },
            { icon: Compass, title: "Environmental Research Logs", desc: "Pair room temperature, noise decibels, and natural lighting with focus endurance benchmarks." },
            { icon: Award, title: "Custom Research Reports", desc: "Generate data-rich environmental profiles for academic publications and institutional facility upgrades." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-sm space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="bg-stone-100 w-12 h-12 rounded-2xl flex items-center justify-center text-stone-900">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">{item.title}</h3>
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-semibold">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section split into user tiers */}
      <section id="pricing" className="w-full max-w-7xl px-6 py-16 bg-white rounded-[3.5rem] border border-stone-200 my-12 shadow-sm space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-[0.25em]">Mesa Licensing Options</span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">Structured Payment Plans</h2>
          <p className="text-stone-500 font-medium text-sm sm:text-base max-w-xl mx-auto">Equip your interior design practice or academic studio with high-fidelity spatial diagnostics and client presentation tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Standard Tier */}
          <div className="p-8 bg-[#faf9f6]/80 rounded-[2.5rem] space-y-6 flex flex-col justify-between border border-stone-200">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 font-mono">Standard</span>
              <h3 className="text-xl font-black text-stone-900">Standard Plan</h3>
              <p className="text-stone-500 text-xs sm:text-sm">Explore spatial vision tools and basic layout calibration guides.</p>
              <div className="text-4xl font-black text-stone-900">$0 <span className="text-xs text-stone-400 font-bold uppercase font-mono">/ Free Forever</span></div>
              <ul className="space-y-3 text-xs text-stone-600">
                <li className="flex items-center gap-2 font-semibold text-emerald-700">✓ 100 daily analysis credits</li>
                <li className="flex items-center gap-2 font-semibold">✓ Basic desk posture & room scoring</li>
                <li className="flex items-center gap-2 font-semibold">✓ Custom noise/temperature sliders</li>
                <li className="flex items-center gap-2 font-semibold text-stone-400">✗ MESA Business Suite & Team Invites</li>
              </ul>
            </div>
            <button onClick={onLogin} className="w-full py-3 bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer">
              Access Studio
            </button>
          </div>

          {[
            {
              tier: "Pro",
              price: "$1.99",
              oldPrice: "$7.99",
              desc: "Best for independent interior designers and active client projects.",
              benefits: [
                "500 Daily premium calibre credits",
                "Advanced 5-Client Space tracking",
                "Pro Lighting & Acoustics Tab unlocked",
                "Detailed ergonomic & aesthetic indices",
                "Presentation report document customizer"
              ],
              btnBg: "bg-stone-900 text-stone-100 hover:bg-stone-800",
              pop: true
            },
            {
              tier: "Corporate",
              price: "$10.99",
              desc: "The complete configuration for interior design firms, studios, and academic faculties.",
              benefits: [
                "MESA Business Suite & Lead Access",
                "Invite Colleagues & Team Members",
                "Infinite Calibre Credits (All features free)",
                "Atmospheric circadian advisory reports",
                "3D redesign text-to-space generator",
                "Full custom branding on PDF briefs"
              ],
              btnBg: "bg-stone-900 text-stone-100 hover:bg-stone-800",
              pop: false
            }
          ].map((plan, idx) => (
            <div key={idx} className={`p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between relative border ${plan.pop ? 'border-amber-500 bg-white shadow-xl shadow-amber-500/5' : 'border-stone-200 bg-white'}`}>
              {plan.pop && (
                <span className="absolute -top-3.5 right-6 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </span>
              )}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 font-mono">{plan.tier} Plan</span>
                <h3 className="text-xl font-black text-stone-900">{plan.tier}</h3>
                <p className="text-stone-500 text-xs sm:text-sm">{plan.desc}</p>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-black text-stone-900 font-mono">{plan.price} <span className="text-xs text-stone-400 font-bold uppercase font-mono">/ month</span></div>
                  {plan.oldPrice && (
                    <div className="text-xl text-stone-400 line-through font-bold">{plan.oldPrice}</div>
                  )}
                </div>
                <ul className="space-y-3 text-xs text-stone-600">
                  {plan.benefits.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-2 font-bold text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={onLogin} className={`w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer ${plan.btnBg}`}>
                Authorize License
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Real visual proof callout */}
      <footer className="border-t border-stone-200/80 pt-16 pb-12 w-full max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between text-stone-400 font-medium gap-8">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-stone-950" />
          <span className="text-stone-950 font-black text-sm uppercase tracking-[0.2em]">Mesa Workspace</span>
        </div>
        
        <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#78716c]">
          <a href="#" className="hover:text-stone-900 transition-colors">Information Systems</a>
          <a href="#" className="hover:text-stone-900 transition-colors">Developer Contact</a>
          <a href="#" className="hover:text-stone-900 transition-colors">Policy Protocol</a>
        </div>
        
        <p className="text-[11px] font-medium text-stone-400">
          © 2026 Mesa Spatial Intelligence Inc. Compiled for verified interior design workspaces.
        </p>
      </footer>
    </div>
  );
}
