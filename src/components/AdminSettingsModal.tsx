import React, { useState } from 'react';
import { X, Shield, Lock, Trash2, Key, Users, History, AlertCircle, Info } from 'lucide-react';
import { FirebaseUser } from '../firebase';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export function AdminSettingsModal({ user, profile, onClose }: { user: FirebaseUser, profile: any, onClose: () => void }) {
  const [cleaning, setCleaning] = useState(false);
  const [adsId, setAdsId] = useState(import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const cleanupOldData = async () => {
    if (!window.confirm("Are you sure you want to clean up all analysis history?")) return;
    setCleaning(true);
    try {
      const q = query(collection(db, 'users', user.uid, 'analyses'));
      const snapshot = await getDocs(q);
      const deletes = snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'analyses', d.id)));
      await Promise.all(deletes);
      alert("Cleanup complete.");
    } catch (err) {
      console.error(err);
    } finally {
      setCleaning(false);
    }
  };

  const handleUpdateAccount = async (tier: 'free' | 'pro' | 'corporate') => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tier,
        isPremium: tier !== 'free',
        updatedAt: new Date()
      });
      alert(`Account updated to ${tier.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-gray-800">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="bg-gray-900 p-3 rounded-2xl text-white">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">System Controls</h2>
              <p className="text-gray-500 font-medium text-sm">Internal developer and optimization settings.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white rounded-2xl border border-gray-200 hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12">
          {/* AdSense Configuration */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">AdSense Logic</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Publisher ID</label>
                  <input 
                    type="text" 
                    value={adsId}
                    onChange={(e) => setAdsId(e.target.value)}
                    className="w-full p-4 bg-white rounded-2xl border border-gray-200 focus:border-amber-500 outline-none font-mono text-sm"
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                  />
               </div>
               <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100">
                  <Info className="w-5 h-5 text-blue-500" />
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                    This ID is currently loaded from the environment variable (VITE_GOOGLE_ADSENSE_CLIENT_ID). 
                    To change it permanently, update your project secrets in the AI Studio sidebar.
                  </p>
               </div>
            </div>
          </section>

          {/* Account Modification (Testing) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Account Simulation</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <button onClick={() => handleUpdateAccount('free')} className="p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-gray-900 transition-all text-center group">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                     <Lock className="w-6 h-6" />
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs">Reset to Free</span>
               </button>
               <button onClick={() => handleUpdateAccount('pro')} className="p-6 bg-white border-2 border-amber-500/20 rounded-3xl hover:border-amber-500 transition-all text-center group">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                     <Shield className="w-6 h-6" />
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs">Set to Pro</span>
               </button>
               <button onClick={() => handleUpdateAccount('corporate')} className="p-6 bg-gray-900 border-2 border-gray-800 rounded-3xl hover:border-amber-500 transition-all text-center group">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                     <Gem className="w-6 h-6" />
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs text-white">Set to Corporate</span>
               </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Infrastructure</h3>
            </div>
            <button 
              onClick={cleanupOldData}
              disabled={cleaning}
              className="w-full p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-between group hover:bg-red-100 transition-all"
            >
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-2xl text-red-500 shadow-sm group-hover:rotate-12 transition-transform">
                    <Trash2 className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-red-900">Hard Prune History</p>
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Permanent Deletion - 8.4GB cache</p>
                 </div>
              </div>
              {cleaning ? <Loader2 className="w-6 h-6 animate-spin text-red-500" /> : <Info className="w-6 h-6 text-red-200" />}
            </button>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Server: AWS-EAST-1 // Build 0512-v4</p>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Gem({ className }: { className?: string }) {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9Z"/>
        <path d="M11 3 8 9l3 12h2l3-12-3-6Z"/>
        <path d="M2 9h20"/>
      </svg>
    )
}
