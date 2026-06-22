'use client';
import React, { useState, useEffect } from 'react';
import { Terminal, Play, Cpu, ShieldAlert, CheckCircle, RefreshCw, LogOut, User, History, Clock, Download, GitBranch, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

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

  const loadHistoricalRecord = (auditRecord) => {
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

    const markdownContent = `# IntelliCode Static Auditor - Diagnostic Report

**Environment Node:** Deployed Workspace Matrix
**Target Mode Type:** ${isRepo ? 'Repository Architecture Audit' : 'Isolated Snippet Validation'}
**Target Context Identifier:** ${isRepo ? repoUrl : LANGUAGES.find(l => l.id === language)?.label || language.toUpperCase()}
**Analysis Timestamp:** ${new Date().toLocaleString()}

---

## 1. Executive Summary & Telemetry Matrix

| Parameter Metric | Profile Diagnostic Value |
| :--- | :--- |
| ${isRepo ? '**Overall Project Score**' : '**Time Complexity Worst-Case**'} | \`${comp.time || 'N/A'}\` |
| ${isRepo ? '**Sub-System Score Breakdown**' : '**Space Allocation Footprint**'} | \`${comp.space || 'N/A'}\` |

### Architectural Vector Rationale
${comp.explanation || 'No profile explanation data available.'}

---

## 2. Structural Findings & Exception Flags

**Total Flags Registered:** ${issues.length} issue(s) detected.

${issues.length === 0 ? '*Review Matrix Clean: No code exceptions discovered.*' : issues.map((issue, idx) => `
### [Flag #${idx + 1}] ${issue.type} Category Violation
* **Location Vector:** ${issue.filePath ? `File: \`${issue.filePath}\` | ` : ''}Source Line ${issue.line}
* **Core Assessment:** ${issue.description}

#### Associated Target Code Snippet
\`\`\`${isRepo ? 'javascript' : language}
${issue.snippet}
\`\`\`
`).join('\n\n')}

---
*Report automatically generated by IntelliCode Static Auditor workspace environment pipeline.*`;

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
          {/* Diagnostic Mode Toggles */}
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
              historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoricalRecord(item)}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/80 transition shadow-sm group text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold group-hover:text-indigo-400 transition ${item.language === 'repository' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-slate-800 text-slate-300'}`}>
                      {item.language}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-indigo-300 mt-1.5 truncate">
                    {item.language === 'repository' ? item.sourceCode.replace('https://github.com/', '') : `${item.timeComplexity} | ${item.spaceComplexity}`}
                  </p>
                  {item.language === 'repository' && (
                    <p className="text-[10px] text-indigo-400 font-mono mt-0.5 font-bold">{item.timeComplexity}</p>
                  )}
                  <span className="text-[10px] text-slate-500 block mt-1 truncate">
                    Issues captured: {item.issuesCount}
                  </span>
                </div>
              ))
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
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isProcessing ? 'Mapping System Context...' : 'Run Diagnostics'}
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-950 p-4 flex flex-col justify-start" data-color-mode="dark">
              {isCurrentRepo ? (
                <div className="space-y-4 my-auto max-w-md mx-auto w-full p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-1">
                    <GitBranch className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-200">Audit Entire Project Repositories</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Provide a public GitHub codebase URL link node. Our static ingestion system parses your directory tree and runs macro security audits across code dependencies.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Public Git URL Target</label>
                    <input
                      type="text"
                      value={repoUrl}
                      disabled={isProcessing}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 font-mono text-xs px-4 py-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 disabled:text-slate-600 transition"
                      placeholder="https://github.com/username/repository"
                    />
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
                  <Terminal className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">Awaiting Target Ingestion</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">Submit a live repo endpoint URL or click a past audit report snapshot log row item from the history panel.</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/30">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Cpu className="h-6 w-6 text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-slate-200">{isCurrentRepo ? 'Ingesting Repository Source Tree' : 'Executing LLM Verification'}</h3>
                <p className="text-sm text-slate-400 max-w-md mt-2 anonymity animate-pulse">
                  {isCurrentRepo ? 'Traversing remote Git blobs and sanitizing package-lock vectors...' : 'Running static scanning validations against structural security models...'}
                </p>
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
                        /* Repository Health Score View Rendering */
                        <div className="space-y-6">
                          <div className="bg-slate-950/60 p-5 rounded-xl border border-indigo-500/20 text-center shadow-lg">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 block mb-1">Overall Project Health Score</span>
                            <code className="text-4xl font-black font-mono text-indigo-300">{analysis.complexity.time}</code>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {analysis.complexity.space.split('|').map((item, index) => {
                              const [label, val] = item.trim().split(':');
                              const fullLabel = label === 'S' ? 'Security' : label === 'A' ? 'Architecture' : label === 'R' ? 'Readability' : 'Maintainability';
                              const colorClass = label === 'S' ? 'text-rose-400' : label === 'A' ? 'text-cyan-400' : label === 'R' ? 'text-emerald-400' : 'text-amber-400';
                              return (
                                <div key={index} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                                  <span className={`text-[10px] font-bold tracking-wider uppercase block mb-1 ${colorClass}`}>{fullLabel} Rating</span>
                                  <code className="text-xl font-black font-mono text-slate-200">{val}/100</code>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Isolated Code Snippet Complexity Rendering */
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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          {analysis.language === 'repository' ? 'Macro System Architectural Overview' : 'Algorithmic Vector Rationale'}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-normal">{analysis.complexity.explanation}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'issues' && (
                    <div className="space-y-4">
                      {analysis.issues?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                          <CheckCircle className="h-10 w-10 text-emerald-500/40 mb-2" />
                          <p className="text-sm font-medium text-slate-400">Review Matrix Clear</p>
                          <p className="text-xs text-slate-500 mt-0.5">No compilation anti-patterns discovered.</p>
                        </div>
                      ) : (
                        analysis.issues?.map((issue, index) => (
                          <div key={index} className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition">
                            <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                issue.type === 'Security' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                issue.type === 'Optimization' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              }`}>
                                {issue.type} Flag
                              </span>
                              <div className="text-xs font-mono text-slate-400 font-medium flex items-center gap-2">
                                {issue.filePath && (
                                  <span className="text-indigo-400 max-w-[180px] truncate bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">{issue.filePath}</span>
                                )}
                                <span>Line: {issue.line}</span>
                              </div>
                            </div>
                            <div className="p-4 space-y-3">
                              <p className="text-sm text-slate-300 leading-relaxed font-normal">{issue.description}</p>
                              <div className="rounded-lg overflow-hidden text-xs shadow-inner">
                                <SyntaxHighlighter language={analysis.language === 'repository' ? 'javascript' : language} style={coldarkDark} customStyle={{ margin: 0, padding: '12px' }}>
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
    </div>
  );
}