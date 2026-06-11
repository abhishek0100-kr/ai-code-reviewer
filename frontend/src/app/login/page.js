'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Terminal, ShieldAlert, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorText('');

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${targetUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Authentication handshake rejected.');
      }

      login(body.user, body.token);
    } catch (err) {
      setErrorText(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
            <Terminal className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Access Secure Workspace</h2>
          <p className="text-xs text-slate-400">Sign in to sync code analysis logs with your repository workspace profiles.</p>
        </div>

        {errorText && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-xs text-rose-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

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

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Password Security Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl transition"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition shadow-md active:scale-95"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Verifying Session...' : 'Authenticate Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Don't have an active user account?{' '}
            <Link href="/register" className="text-indigo-400 hover:underline font-medium">
              Create profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}