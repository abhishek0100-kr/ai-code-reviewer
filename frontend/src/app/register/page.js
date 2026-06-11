'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Terminal, ShieldAlert, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState('');
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
      const response = await fetch(`${targetUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Failed to establish identity footprint.');
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
          <h2 className="text-xl font-bold tracking-tight">Create Developer Profile</h2>
          <p className="text-xs text-slate-400">Register now to lock down structural audit trails across deployment lines.</p>
        </div>

        {errorText && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-xs text-rose-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Full Identity Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl transition"
              placeholder="Abhishek Kumar"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Email Address Address</label>
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
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Secure Password String</label>
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
            {isSubmitting ? 'Registering Identity...' : 'Initialize Profile Ecosystem'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Already registered on this network node?{' '}
            <Link href="/login" className="text-indigo-400 hover:underline font-medium">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}