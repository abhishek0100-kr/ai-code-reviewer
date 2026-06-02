'use client';
import React, { useState } from 'react';
import { Terminal, Play, Cpu, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';

const LANGUAGES = [
  { id: 'js', label: 'JavaScript' },
  { id: 'py', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'go', label: 'Go' }
];

export default function Dashboard() {
  const [sourceCode, setSourceCode] = useState('function processData(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] == "admin") {\n      eval(arr[i]);\n    }\n  }\n  return result;\n}');
  const [language, setLanguage] = useState('js');
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('complexity');

  const executeReviewPayload = async () => {
    if (!sourceCode.trim()) return;
    setIsProcessing(true);
    setErrorMessage('');
    setAnalysis(null);

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${targetUrl}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sourceCode })
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.message || 'System encountered an unhandled network pipeline error.');
      }

      setAnalysis(responseBody);
    } catch (err) {
      setErrorMessage(err.message || 'The host connection was abruptly refused. Confirm backend service status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const lineCount = sourceCode.split('\n').length;
  const targetIssues = analysis?.issues?.filter(item => item.line <= lineCount) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            IntelliCode Static Auditor <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">v1.0-MVP</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 text-slate-200 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer transition-all"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-slate-900">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Source Code Console</span>
            <button
              onClick={executeReviewPayload}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-all shadow-md active:scale-95"
            >
              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isProcessing ? 'Auditing Script...' : 'Run Diagnostics'}
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 p-2 min-h-[400px]" data-color-mode="dark">
            <CodeEditor
              value={sourceCode}
              language={language}
              placeholder="Paste or write your code here..."
              onChange={(e) => setSourceCode(e.target.value)}
              padding={15}
              disabled={isProcessing}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                fontSize: 14,
                backgroundColor: 'transparent',
                minHeight: '100%'
              }}
            />
          </div>
        </div>

        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {!analysis && !isProcessing && !errorMessage && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
                <Terminal className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Awaiting Code Submission</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Paste your code block inside the console and trigger diagnostics to execute static code analysis execution paths.</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/30">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <Cpu className="h-6 w-6 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">Executing LLM Verification</h3>
              <p className="text-sm text-slate-400 max-w-md mt-2 animate-pulse">Running static scanning validations against structural security models...</p>
              <div className="mt-6 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 max-w-xs shadow-sm">
                <strong>Notice:</strong> Server instances deployed on free tier nodes might experience 30-45 second spin-up delays during initial requests.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-md font-medium text-rose-400">Pipeline Communication Error</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1">{errorMessage}</p>
              <button onClick={executeReviewPayload} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition">
                Retry Connection Execution
              </button>
            </div>
          )}

          {analysis && !isProcessing && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-950/80 border-b border-slate-800 flex">
                <button
                  onClick={() => setActiveTab('complexity')}
                  className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition ${activeTab === 'complexity' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/40' : 'text-slate-400 hover:bg-slate-800/30'}`}
                >
                  Algorithmic Complexity
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider relative transition ${activeTab === 'issues' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/40' : 'text-slate-400 hover:bg-slate-800/30'}`}
                >
                  Structural Vulnerabilities
                  {targetIssues.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                      {targetIssues.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/10">
                {activeTab === 'complexity' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 shadow-md">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 block mb-1">Time Profile Complexity</span>
                        <code className="text-2xl font-black font-mono text-indigo-300">{analysis.complexity.time}</code>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 shadow-md">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 block mb-1">Space Allocation Footprint</span>
                        <code className="text-2xl font-black font-mono text-cyan-300">{analysis.complexity.space}</code>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Algorithmic Vector Rationale</h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-normal">{analysis.complexity.explanation}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="space-y-4">
                    {targetIssues.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <CheckCircle className="h-10 w-10 text-emerald-500/40 mb-2" />
                        <p className="text-sm font-medium text-slate-400">Review Matrix Clear</p>
                        <p className="text-xs text-slate-500 mt-0.5">No violations matching standard anti-pattern setups detected.</p>
                      </div>
                    ) : (
                      targetIssues.map((issue, index) => (
                        <div key={index} className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition">
                          <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              issue.type === 'Security' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                              issue.type === 'Optimization' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}>
                              {issue.type} Flag
                            </span>
                            <span className="text-xs font-mono text-slate-400 font-medium">Line Vector: {issue.line}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <p className="text-sm text-slate-300 leading-relaxed font-normal">{issue.description}</p>
                            <div className="rounded-lg overflow-hidden text-xs shadow-inner">
                              <SyntaxHighlighter language={language === 'js' ? 'javascript' : language === 'py' ? 'python' : language} style={coldarkDark} customStyle={{ margin: 0, padding: '12px' }}>
                                {issue.snippet}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}