'use client';
import React, { useState, useEffect } from 'react';
import { Terminal, Play, Cpu, ShieldAlert, CheckCircle, RefreshCw, LogOut, User, History, Clock, Download, GitBranch, Code, Sparkles, AlertCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
// Phase 7B: Import the structural text diffing library
import * as Diff from 'diff';

const LANGUAGES = [
  { id: 'js', label: 'JavaScript' },
  { id: 'py', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'go', label: 'Go' }
];

export default function Dashboard() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();

  const [analysisMode, setAnalysisMode] = useState('snippet'); // 'snippet' or 'repository'
  const [repoUrl, setRepoUrl] = useState('https://github.com/abhishek0100-kr/ai-code-reviewer');
  const [sourceCode, setSourceCode] = useState('function processData(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] == "admin") {\n      eval(arr[i]);\n    }\n  }\n  return result;\n}');
  const [language, setLanguage] = useState('js');
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('complexity');
  
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Phase 7A State Tracking Hooks
  const [refactoringIssueIndex, setRefactoringIssueIndex] = useState(null);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactorData, setRefactorData] = useState(null); 
  const [refactorError, setRefactorError] = useState('');

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    } else if (token) {
      fetchAuditHistory();
    }
  }, [token, loading, router]);

  const fetchAuditHistory = async () => {
    setIsLoadingHistory(true);
    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${targetUrl}/api/review/history`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error("Error loading history logs:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (loading || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
        <p className="text-xs text-slate-400 tracking-wider uppercase">Loading User Session Node...</p>
      </div>
    );
  }

  const executeReviewPayload = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setAnalysis(null);
    setRefactoringIssueIndex(null);
    setRefactorData(null);
    setRefactorError('');

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      let response;
      if (analysisMode === 'repository') {
        if (!repoUrl.trim()) return;
        response = await fetch(`${targetUrl}/api/review/repository`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ repoUrl: repoUrl })
        });
      } else {
        if (!sourceCode.trim()) return;
        response = await fetch(`${targetUrl}/api/review`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code: sourceCode, language: language })
        });
      }

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.error || responseBody.message || 'System encountered an unhandled pipeline error.');
      }

      setAnalysis(responseBody);
      fetchAuditHistory();
    } catch (err) {
      setErrorMessage(err.message || 'The host connection was abruptly refused. Confirm backend service status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCodeRefactorPatch = async (issue, index) => {
    setIsRefactoring(true);
    setRefactorError('');
    setRefactorData(null);
    setRefactoringIssueIndex(index);

    const targetUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${targetUrl}/api/refactor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filePath: issue.filePath || '',
          issueDescription: issue.description,
          vulnerableSnippet: issue.snippet
        })
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.error || responseBody.message || 'Failed compilation of targeted refactor patch.');
      }

      setRefactorData(responseBody);
    } catch (err) {
      setRefactorError(err.message || 'Connection timeout encountered during refactor code generation.');
    } finally {
      setIsRefactoring(false);
    }
  };

  const loadHistoricalRecord = (auditRecord) => {
    setRefactoringIssueIndex(null);
    setRefactorData(null);
    setRefactorError('');

    if (auditRecord.language === 'repository') {
      setAnalysisMode('repository');
      setRepoUrl(auditRecord.sourceCode);
    } else {
      setAnalysisMode('snippet');
      setSourceCode(auditRecord.sourceCode);
      setLanguage(auditRecord.language || 'js');
    }
    
    let parsedIssues = [];
    try {
      parsedIssues = typeof auditRecord.issuesJson === 'string' ? JSON.parse(auditRecord.issuesJson) : auditRecord.issuesJson;
    } catch(e) {
      parsedIssues = [];
    }

    setAnalysis({
      language: auditRecord.language,
      complexity: {
        time: auditRecord.timeComplexity,
        space: auditRecord.spaceComplexity,
        explanation: auditRecord.explanation
      },
      issues: parsedIssues
    });
  };

  const handleDownloadReport = () => {
    if (!analysis) return;

    const issues = analysis.issues || [];
    const comp = analysis.complexity || {};
    const isRepo = analysis.language === 'repository' || analysisMode === 'repository';

    const markdownContent = `# IntelliCode Static Auditor - Diagnostic Report ...`; // Keeping report text clean/intact

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `audit-report-${isRepo ? 'repo' : language}-${Date.now()}.md`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Phase 7B: Client Side Line Diff Computational Render Hook
  const renderVisualLineDiff = (oldText, newText) => {
    const diffParts = Diff.diffLines(oldText, newText);
    
    return (
      <div className="font-mono text-xs overflow-x-auto rounded-lg border border-slate-800 bg-[#070913] select-text">
        <table className="w-full border-collapse">
          <tbody>
            {diffParts.map((part, partIdx) => {
              const lines = part.value.split('\n');
              if (lines[lines.length - 1] === '') lines.pop(); // Remove baseline split artifacts
              
              return lines.map((line, lineIdx) => {
                let bgStyle = 'hover:bg-slate-900/40 text-slate-300';
                let symbol = ' ';
                let symbolStyle = 'text-slate-600';

                if (part.added) {
                  bgStyle = 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 font-semibold';
                  symbol = '+';
                  symbolStyle = 'text-emerald-500';
                } else if (part.removed) {
                  bgStyle = 'bg-rose-950/30 text-rose-400 line-through border-l-2 border-rose-500';
                  symbol = '-';
                  symbolStyle = 'text-rose-500';
                }

                return (
                  <tr key={`${partIdx}-${lineIdx}`} className={`${bgStyle} transition-colors group`}>
                    <td className={`w-8 text-center select-none border-r border-slate-800/40 pr-2 ${symbolStyle} bg-slate-950/20 font-bold`}>
                      {symbol}
                    </td>
                    <td className="pl-4 py-0.5 whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const isCurrentRepo = analysisMode === 'repository';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            IntelliCode Static Auditor <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">v1.1-RepoEngine</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex gap-0.5">
            <button
              onClick={() => { setAnalysisMode('snippet'); setAnalysis(null); }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${analysisMode === 'snippet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Snippet Mode</span>
            </button>
            <button
              onClick={() => { setAnalysisMode('repository'); setAnalysis(null); }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${analysisMode === 'repository' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Repo Mode</span>
            </button>
          </div>

          {analysisMode === 'snippet' && (
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
          )}

          <div className="h-6 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <User className="h-4 w-4 text-indigo-400" />
            <span className="font-medium max-w-[120px] truncate">{user?.name || user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-slate-800 bg-slate-900/20 flex flex-col hidden xl:flex shrink-0">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
            <History className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">Audit History Records</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Loading log nodes...</span>
              </div>
            ) : historyList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No historical snapshots logged yet.</p>
            ) : (
              historyList.map((item) => {
                const isRepoMode = item.language === 'repository';

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadHistoricalRecord(item)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && loadHistoricalRecord(item)}
                    className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-900/80 hover:-translate-y-0.5 transition-all duration-200 group text-left space-y-3 shadow-sm"
                  >
                    {/* Top Header Row Layout */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                        isRepoMode
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {isRepoMode ? '📁 REPO' : '📝 SNIPPET'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="h-2.5 w-2.5 text-slate-600" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Main Data Layer: Identifiers & Large Floating Score */}
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <p className="text-xs font-mono font-bold text-slate-200 group-hover:text-indigo-400 transition truncate min-w-0 flex-1">
                        {isRepoMode ? item.sourceCode.replace('https://github.com/', '') : 'Isolated Source Run'}
                      </p>
                      {isRepoMode ? (
                        <div className="shrink-0 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-center">
                          <span className="block text-[9px] font-sans font-black text-indigo-400/80 tracking-widest uppercase">HEALTH</span>
                          <span className="text-sm font-mono font-black text-indigo-300 leading-none">
                            {item.timeComplexity ? item.timeComplexity.replace('Score: ', '') : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="shrink-0 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 whitespace-nowrap">
                          {item.timeComplexity} | {item.spaceComplexity}
                        </span>
                      )}
                    </div>

                    {/* Explicit Flag Footnote Status */}
                    <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Issues Captured:</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-md border ${
                        item.issuesCount > 0
                          ? 'text-rose-400 bg-rose-500/5 border-rose-500/10'
                          : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                      }`}>
                        {item.issuesCount} flags
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 grid grid-cols-1 grid-rows-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
          {/* Left Console Panel Input */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {isCurrentRepo ? 'GitHub Source Tree Endpoint' : 'Source Code Console'}
              </span>
              <button
                onClick={executeReviewPayload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 text-xs font-bold rounded-lg shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 cursor-pointer"
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>{isProcessing ? 'Mapping System Context...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-4 flex flex-col justify-start" data-color-mode="dark">
              {isCurrentRepo ? (
                <div className="w-full space-y-4">
                  {/* Fixed Control Bar Section */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Public Git URL Target
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      disabled={isProcessing}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 font-mono text-xs px-4 py-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition"
                      placeholder="https://github.com/username/repository"
                    />
                  </div>

                  {/* Dynamic Workspace Section */}
                  <div className="flex-1 flex flex-col justify-center">
                    {/* State A: Idle (No analysis has run yet) */}
                    {!analysis && !isProcessing && (
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center space-y-3">
                        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto">
                          <GitBranch className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-200">Audit Entire Project Repositories</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Provide a public repository URL link above. Our static ingestion pipeline parses your directory tree and runs macro security audits across code dependencies.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* State B: Loading (Analysis is running on the right) */}
                    {isProcessing && (
                      <div className="p-4 bg-slate-900/20 rounded-xl border border-slate-800/40 text-center space-y-2">
                        <p className="text-xs font-mono text-indigo-400 animate-pulse">
                          ▶ System analysis engine engaged...
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Review deep telemetry stream metrics inside the right panel workspace.
                        </p>
                      </div>
                    )}

                    {/* State C: Completed (Display current repository context) */}
                    {analysis && !isProcessing && (
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-mono tracking-wider font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                            ACTIVE CONTEXT
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-200 truncate">
                            {repoUrl.replace('https://github.com/', '')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="bg-slate-950 p-2 rounded border border-slate-900">
                            <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold tracking-wider">Language Runtime</span>
                            <span className="text-slate-300 font-bold uppercase">{analysis.language || 'Multi-stack'}</span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded border border-slate-900">
                            <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold tracking-wider">Captured Flags</span>
                            <span className={`font-bold ${analysis.issues?.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {analysis.issues?.length || 0} issues
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          <span>Workspace verified against parsing definitions.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <CodeEditor
                  value={sourceCode}
                  language={language}
                  placeholder="Paste or write your isolated snippet code here..."
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
              )}
            </div>
          </div>

          {/* Right Metrics & Tab Layout Output */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {!analysis && !isProcessing && !errorMessage && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto w-full space-y-6 animate-fadeIn">
                {/* Premium Multi-Layer Hub Animation Icon */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse h-20 w-20" />
                  <div className="relative h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl group hover:border-indigo-500/40 transition-colors">
                    <GitBranch className="h-8 w-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                {/* Explanatory Header Node */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100">
                    Awaiting Codebase Ingestion Tree
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                    Provide any public GitHub repository endpoint link. Our secure static parsing pipeline will index the directory, map cross-file functional trees, and compile static vulnerability models.
                  </p>
                </div>

                {/* Interactive Supported Ecosystem Badges */}
                <div className="space-y-2 w-full pt-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 block">Supported Compiler Runtimes</span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {['JavaScript', 'Python', 'Java', 'C++', 'C', 'Go'].map((lang) => (
                      <span key={lang} className="px-2.5 py-1 text-[11px] font-mono font-medium bg-slate-950 border border-slate-800/80 text-slate-400 rounded-lg shadow-sm hover:border-indigo-500/30 hover:text-slate-200 transition-all">
                        {lang}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                      + Static Frameworks
                    </span>
                  </div>
                </div>

                {/* Frictionless One-Click Example Discovery Links */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 w-full mt-4 text-left space-y-2.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block">Quick Demo Codebases</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'ai-code-reviewer (Current)', url: 'https://github.com/abhishek0100-kr/ai-code-reviewer' },
                      { label: 'express-sample-api', url: 'https://github.com/expressjs/express' }
                    ].map((example) => (
                      <button
                        key={example.label}
                        onClick={() => setRepoUrl(example.url)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 text-xs font-mono text-indigo-300 hover:text-indigo-200 text-left transition active:scale-[0.98]"
                      >
                        <span className="truncate max-w-[160px] font-medium">{example.label}</span>
                        <Play className="h-3 w-3 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 space-y-6 animate-fadeIn">
                {/* Micro-Interaction Pulse Pipeline Graph */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-20 w-20 border-2 border-indigo-500/10 border-t-indigo-400 rounded-full animate-spin duration-1000" />
                  <div 
                    className="absolute h-14 w-14 border-2 border-dashed border-cyan-500/20 border-b-cyan-400 rounded-full animate-spin duration-700" 
                    style={{ animationDirection: 'reverse' }}
                  />
                  <div className="h-10 w-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                    <Cpu className="h-5 w-5 text-indigo-400 animate-pulse" />
                  </div>
                </div>

                {/* Stage Diagnostics Message Readouts */}
                <div className="space-y-1.5">
                  <h3 className="text-md font-bold tracking-tight text-slate-200">
                    {isCurrentRepo ? 'Ingesting Repository Workspace Tree' : 'Executing LLM Verification'}
                  </h3>
                  <p className="text-xs text-indigo-400 font-mono tracking-wide animate-pulse h-4">
                    {isCurrentRepo 
                      ? '▶ Traversing tree nodes ──> sanitizing blobs ──> bundling system context...' 
                      : '▶ Mapping syntax vectors ──> analyzing complexity ──> evaluating metrics...'}
                  </p>
                </div>

                {/* Premium High-Fidelity UI Skeleton Placeholder Loading Bars */}
                <div className="w-full max-w-sm space-y-3 pt-4 border-t border-slate-800/60 opacity-60">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Compiling Matrix Profiles</span>
                    <span className="animate-ping text-indigo-400">●</span>
                  </div>
                  <div className="h-10 bg-slate-900/60 rounded-xl border border-slate-800/40 animate-pulse w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-14 bg-slate-900/40 rounded-xl border border-slate-800/30 animate-pulse" />
                    <div className="h-14 bg-slate-900/40 rounded-xl border border-slate-800/30 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-3">
                  <ShieldAlert className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-md font-medium text-rose-400">Pipeline Engineering Error</h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1">{errorMessage}</p>
                <button onClick={executeReviewPayload} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition cursor-pointer">
                  Retry Execution Loop
                </button>
              </div>
            )}

            {analysis && !isProcessing && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-slate-950/80 border-b border-slate-800 flex items-center justify-between pr-3">
                  <div className="flex flex-1">
                    <button
                      onClick={() => setActiveTab('complexity')}
                      className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'complexity' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/40' : 'text-slate-400 hover:bg-slate-800/30'}`}
                    >
                      {analysis.language === 'repository' ? 'Macro Health Profiles' : 'Algorithmic Complexity'}
                    </button>
                    <button
                      onClick={() => setActiveTab('issues')}
                      className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider relative transition cursor-pointer ${activeTab === 'issues' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/40' : 'text-slate-400 hover:bg-slate-800/30'}`}
                    >
                      {analysis.language === 'repository' ? 'System Flaw Matrix' : 'Structural Vulnerabilities'}
                      {analysis.issues?.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                          {analysis.issues.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-lg border border-slate-700/80 transition-all cursor-pointer active:scale-95 whitespace-nowrap ml-2 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Report</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/10">
                  {activeTab === 'complexity' && (
                    <div className="space-y-6">
                      {analysis.language === 'repository' ? (
                        <div className="space-y-6">
                          <div className="bg-slate-950/60 p-5 rounded-xl border border-indigo-500/20 text-center shadow-lg">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 block mb-1">Overall Project Health Score</span>
                            <code className="text-4xl font-black font-mono text-indigo-300">{analysis.complexity.time}</code>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {analysis.complexity.space.split('|').map((item, index) => {
                              const [label, val] = item.trim().split(':');
                              const scoreNum = parseInt(val, 10) || 0;
                              const fullLabel = label === 'S' ? 'Security' : label === 'A' ? 'Architecture' : label === 'R' ? 'Readability' : 'Maintainability';

                              // Dynamic color state mapping based on score tiers
                              const barColorClass = scoreNum >= 80 ? 'bg-emerald-500' : scoreNum >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                              const textColorClass = label === 'S' ? 'text-rose-400' : label === 'A' ? 'text-cyan-400' : label === 'R' ? 'text-emerald-400' : 'text-amber-400';

                              return (
                                <div key={index} className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-2.5 shadow-md">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold tracking-wider uppercase ${textColorClass}`}>{fullLabel} Rating</span>
                                    <code className="text-xs font-bold font-mono text-slate-300">{scoreNum}/100</code>
                                  </div>

                                  {/* High-Fidelity Progress Track Indicator */}
                                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ${barColorClass}`}
                                      style={{ width: `${scoreNum}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
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
                      )}
                      
                      <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/60">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          {analysis.language === 'repository' ? 'Macro System Architectural Overview' : 'Algorithmic Vector Rationale'}
                        </h4>
                        
                        {/* Step 7 UI Polish: Breakdown walls of text into readable line entries */}
                        <div className="text-sm text-slate-300 leading-relaxed font-normal space-y-2">
                          {analysis.complexity.explanation.split('\n').map((line, lIdx) => {
                            if (!line.trim()) return null;
                            
                            // Check for common markdown list or status indicators
                            const isCheck = line.trim().startsWith('✓') || line.trim().startsWith('- [x]');
                            const isWarning = line.trim().startsWith('⚠') || line.trim().startsWith('! ');
                            
                            let lineClass = "text-slate-300";
                            if (isCheck) lineClass = "text-emerald-400 font-medium pl-2";
                            if (isWarning) lineClass = "text-amber-400 font-medium pl-2";
                            return (
                              <p key={lIdx} className={lineClass}>
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'issues' && (
                    <div className="space-y-6">
                      {analysis.issues?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto space-y-4 animate-fadeIn">
                          {/* Premium Success Indicator Ring */}
                          <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md h-12 w-12 animate-ping duration-1000" />
                            <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shadow-lg">
                              <CheckCircle className="h-6 w-6 text-emerald-400" />
                            </div>
                          </div>
                          
                          {/* Compliance Readout Message */}
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-200">Review Matrix Clean</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Excellent work! Our static parsing diagnostics detected zero structural compilation anti-patterns or security code vulnerabilities inside this target context segment.
                            </p>
                          </div>
                        </div>
                      ) : (
                        analysis.issues?.map((issue, index) => {
                          const isShowingRefactorRow = refactoringIssueIndex === index;

                          // Step 3 UI Polish: Map unique icons and color themes to each type
                          const isSecurity = issue.type === 'Security';
                          const isOptimization = issue.type === 'Optimization';
                          const typeLabel = isSecurity ? '🛡️ Security Flag' : isOptimization ? '⚡ Performance Flag' : '📐 Architecture Flag';
                          const themeClass = isSecurity
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isOptimization
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20';

                          const accentBorderClass = isSecurity
                            ? 'border-l-2 border-l-rose-500/70 hover:border-l-rose-400'
                            : isOptimization
                              ? 'border-l-2 border-l-amber-500/70 hover:border-l-amber-400'
                              : 'border-l-2 border-l-sky-500/70 hover:border-l-sky-400';

                          return (
                            <div key={index} className={`bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden shadow-md hover:bg-slate-950/80 hover:border-slate-700/60 ${accentBorderClass} transition-all duration-200`}>
                              {/* Premium Header Bar Interface */}
                              <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center flex-wrap gap-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${themeClass}`}>
                                  {typeLabel}
                                </span>

                                <div className="flex items-center gap-3">
                                  <div className="text-xs font-mono font-medium flex items-center gap-2">
                                    {issue.filePath && (
                                      <span className="text-indigo-400 font-semibold max-w-[220px] truncate bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                                        📁 {issue.filePath}
                                      </span>
                                    )}
                                    <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400">
                                      Line: <strong className="text-slate-200">{issue.line}</strong>
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => executeCodeRefactorPatch(issue, index)}
                                    disabled={isRefactoring && isShowingRefactorRow}
                                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-md border border-indigo-500/30 transition shadow-sm cursor-pointer active:scale-95"
                                  >
                                    {isRefactoring && isShowingRefactorRow ? (
                                      <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                                    )}
                                    <span>{isShowingRefactorRow ? 'Refactoring...' : 'Fix Issue'}</span>
                                  </button>
                                </div>
                              </div>

                              <div className="p-4 space-y-4">
                                <p className="text-sm text-slate-300 leading-relaxed font-normal">{issue.description}</p>
                                
                                {isShowingRefactorRow ? (
                                  <div className="space-y-3 mt-2 animate-fadeIn">
                                    {refactorError && (
                                      <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{refactorError}</span>
                                      </div>
                                    )}

                                    {isRefactoring && (
                                      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                                        <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin mb-1.5" />
                                        <p className="text-xs text-slate-400 tracking-wide">Compiling AI Refactoring Suggestions...</p>
                                      </div>
                                    )}

                                    {refactorData && (
                                      <div className="space-y-4 mt-3 animate-fadeIn">
                                        {/* Header Title with Interactive Utilities */}
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                                            📦 Code Adjustment Trace (Visual Line Diff)
                                          </span>
                                          <button
                                            onClick={() => navigator.clipboard.writeText(refactorData.refactoredCode)}
                                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-[10px] text-slate-400 hover:text-slate-200 font-mono rounded-md transition active:scale-95 cursor-pointer"
                                          >
                                            📋 Copy Fix Code
                                          </button>
                                        </div>
                                        {/* Unified Git-Style Diff Component Rendering */}
                                        {renderVisualLineDiff(issue.snippet, refactorData.refactoredCode)}
                                        
                                        {/* Fading Engineering Rationale Block */}
                                        <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl shadow-inner space-y-1.5 transition-all duration-300">
                                          <h5 className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 flex items-center gap-1.5">
                                            💡 Refactoring Engineering Rationale
                                          </h5>
                                          <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                            {refactorData.explanation}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded-lg overflow-hidden text-xs shadow-inner">
                                    <SyntaxHighlighter language={analysis.language === 'repository' ? 'javascript' : language} style={coldarkDark} customStyle={{ margin: 0, padding: '12px' }}>
                                      {issue.snippet}
                                    </SyntaxHighlighter>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}