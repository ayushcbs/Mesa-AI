import React, { useState } from 'react';
import { MessageSquare, Star, Send, X, CheckCircle2, Mail, ShieldCheck, HeartHandshake } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackModalProps {
  user: any;
  userProfile: any;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ user, userProfile, onClose }) => {
  const [category, setCategory] = useState<'general' | 'bug' | 'feature' | 'praise'>('general');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState(user?.email || userProfile?.email || '');
  const [userName, setUserName] = useState(user?.displayName || userProfile?.displayName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your message before submitting.");
      return;
    }
    if (!userEmail.trim()) {
      setError("Please provide a valid contact email.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const feedbackData = {
      category,
      rating,
      subject: subject.trim() || `${category.toUpperCase()} Feedback`,
      message: message.trim(),
      userEmail: userEmail.trim(),
      userName: userName.trim() || 'Anonymous User',
      targetEmail: 'urfaceismylife@gmail.com',
      userId: user?.uid || 'guest',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Send via backend server endpoint
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      const resData = await response.json();

      // 2. Also record in Firestore feedback collection
      if (user?.uid) {
        try {
          await addDoc(collection(db, 'feedback'), {
            ...feedbackData,
            createdAt: serverTimestamp()
          });
        } catch (fErr) {
          console.log("Firestore offline cache write logged for feedback.");
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Feedback submission error:", err);
      // Fallback: Save to Firestore directly if API route is unreachable
      try {
        await addDoc(collection(db, 'feedback'), {
          ...feedbackData,
          createdAt: serverTimestamp()
        });
        setSubmitted(true);
      } catch (fErr) {
        setError("Unable to submit feedback. Please check your internet connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl p-6 md:p-8 text-stone-100 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-stone-100">Project Feedback</h2>
              <p className="text-xs text-stone-400">Direct transmission to the project developer</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-stone-100">Thank You for Your Feedback!</h3>
            <p className="text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
              Your message has been dispatched to <span className="text-emerald-400 font-semibold">the developer</span>. We review all workspace suggestions and bug reports carefully.
            </p>

            <div className="pt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-950/40"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'general', label: 'General', icon: MessageSquare },
                  { id: 'bug', label: 'Bug Report', icon: ShieldCheck },
                  { id: 'feature', label: 'Feature Idea', icon: Send },
                  { id: 'praise', label: 'Praise', icon: HeartHandshake },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-stone-800/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Overall Experience Rating
              </label>
              <div className="flex items-center space-x-1 bg-stone-800/40 p-3 rounded-xl border border-stone-800/80">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-xs text-stone-400 font-mono">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* User Info Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-stone-800/70 border border-stone-700/70 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-stone-800/70 border border-stone-700/70 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback..."
                className="w-full bg-stone-800/70 border border-stone-700/70 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Feedback Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or issues in detail..."
                className="w-full bg-stone-800/70 border border-stone-700/70 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Footer with email target indicator and submit */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <div className="flex items-center space-x-1.5 text-[11px] text-stone-400">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emailed to: <strong className="text-stone-200">the developer</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-stone-900 font-semibold rounded-xl text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-950/40"
                >
                  {submitting ? (
                    <span>Dispatching...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
