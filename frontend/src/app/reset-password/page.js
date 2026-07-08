'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Terminal, ShieldAlert, RefreshCw, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Safely extract the query token on mount hook
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setFeedbackText('Secure token string param is missing from your recovery URL node link.');
    }
  }, [searchParams]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setFeedbackText('Operational mismatch: Passwords do not align.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackText('');
    setIsSuccess(false);

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${targetUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || 'Handshake rejected by authentication gateway.');
      }

      setIsSuccess(true);
      setFeedbackText('Ecosystem security keys updated successfully! Redirecting to workspace portal...');
      
      // Auto routing delay back to active login node
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      setFeedbackText(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Onboarding Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
            <Terminal className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Overwrite Security Keys</h2>
          <p className="text-xs text-slate-400">Establish your updated developer credential parameters below.</p>
        </div>

        {/* Status Messages */}
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

        {/* Input Interface */}
        {!isSuccess && token && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">New Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm pl-4 pr-10 py-2.5 rounded-xl transition"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Confirm Security Key</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl transition"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Overwriting Identity Hash...' : 'Update Password Entry'}
            </button>
          </form>
        )}

        {/* Footer Shortcut */}
        <div className="text-center pt-2 border-t border-slate-800/40">
          <Link href="/login" className="text-xs text-indigo-400 hover:underline font-medium">
            Return to Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
}