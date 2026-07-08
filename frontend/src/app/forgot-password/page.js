'use client';

import React, { useState } from 'react';
import { Terminal, ShieldAlert, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setFeedbackText('');
    setIsSuccess(false);

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${targetUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const body = await response.json();
      
      setIsSuccess(true);
      setFeedbackText(body.message || 'If an account matches that email address, a secure recovery token has been dispatched.');
    } catch (err) {
      setIsSuccess(true);
      setFeedbackText('If an account matches that email address, a secure recovery token has been dispatched.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 animate-fadeIn">
        
        {/* Onboarding Identity Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
            <Terminal className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Recover Account Access</h2>
          <p className="text-xs text-slate-400">Provide your verified account email to request a secure password resetting key.</p>
        </div>

        {/* Dynamic Context Feedback Callouts */}
        {feedbackText && (
          <div className={`p-3 border rounded-xl flex items-start gap-3 text-xs ${
            isSuccess 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isSuccess ? (
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedbackText}</span>
          </div>
        )}

        {/* Input Interface Area Form */}
        {!isSuccess && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl transition"
                placeholder="developer@domain.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Dispatching Payload...' : 'Request Reset Link'}
            </button>
          </form>
        )}

        {/* Navigation Utilities Matrix Footnote */}
        <div className="text-center pt-2 border-t border-slate-800/40">
          <Link href="/login" className="text-xs text-indigo-400 hover:underline font-medium">
            ← Return to Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
}