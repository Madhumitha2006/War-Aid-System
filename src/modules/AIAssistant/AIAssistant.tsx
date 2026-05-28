/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, Send, Mic, Volume2, ShieldAlert, BookOpen, 
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Info, Activity, Shield, Package, Flame 
} from 'lucide-react';
import { AgentRouter, AGENT_LIST, AgentDetails } from '../../agents/AgentRouter';
import { MapMarker, LatLng, AppLanguage } from '../../types';
import { SURVIVAL_GUIDES, EMERGENCY_CONTACTS } from '../../data/knowledgeBase';

interface Props {
  markers: MapMarker[];
  isOnline: boolean;
  currentUserLocation: LatLng;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  emergencyMode: boolean;
}

interface MessageBubble {
  sender: 'user' | 'ai';
  text: string;
  agentName?: string;
  agentIcon?: string;
}

export default function AIAssistant({
  markers,
  isOnline,
  currentUserLocation,
  language,
  setLanguage,
  emergencyMode
}: Props) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [modelType, setModelType] = useState<'ondevice' | 'hybrid'>(isOnline ? 'hybrid' : 'ondevice');
  const [aiHistory, setAiHistory] = useState<MessageBubble[]>([
    {
      sender: 'ai',
      text: "### Welcome to WarAid Multi-Agent AI\n\nI am an on-device decentralized intelligence hub designed to run 100% offline without cellphone towers. Choose your specialized channel or type any trauma question.\n\n* **MedAgent**: First aid wounds care, tourniquet timings, CPR mechanics.\n* **SurvivalAgent**: Active shelling protection, bomb shelter actions.\n* **ResourceAgent**: Computes nearest medical/drinking water hubs.\n* **DisasterAgent**: Landfall storm preps, floods, tsunami safety.\n\nType **'bleed care'**, **'where is water'**, or **'shell shelter'** to test offline routers.",
      agentName: 'Unified Comm Coordinator',
      agentIcon: 'ShieldAlert'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);
  
  // Knowledge Base toggles
  const [showKB, setShowKB] = useState(false);
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);

  // Real-time voice parameters
  const [isDictating, setIsDictating] = useState(false);

  // Trigger simulated Phi-3 mini model pre-caching on first button tap
  const startModelDownload = () => {
    if (downloadProgress !== null) return; // already downloading or done
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 12; // load ~500MB weights package
      });
    }, 400);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userText = userInput;
    setUserInput('');
    setIsTyping(true);

    // Insert user bubble
    setAiHistory(prev => [...prev, { sender: 'user', text: userText }]);

    // Route Agent & Fetch answer (runs offline-first logic)
    setTimeout(async () => {
      const response = await AgentRouter.getResponse(
        userText,
        isOnline, // uses server-side Gemini if online
        language,
        currentUserLocation,
        markers
      );

      setAiHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: response.text,
          agentName: response.agent.alias,
          agentIcon: response.agent.icon
        }
      ]);
      
      setIsTyping(false);

      // Perform speech synthesis if voice is supported and not in emergency mode
      if (!emergencyMode) {
        speakResponse(response.text);
      }
    }, 900);
  };

  const speakResponse = (fullMarkdownText: string) => {
    // Strip markdown formatting characters to speak clearly offline
    const plainText = fullMarkdownText
      .replace(/[#*`_[\]()]/g, '')
      .replace(/-\s/g, '')
      .slice(0, 150); // limit speech length for emergency stability

    try {
      window.speechSynthesis.cancel(); // kill existing feeds
      const utterance = new SpeechSynthesisUtterance(plainText);
      
      // Attempt to map matching voice language
      if (language === 'ta') utterance.lang = 'ta-IN';
      else if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'uk') utterance.lang = 'uk-UA';
      else if (language === 'ar') utterance.lang = 'ar-SA';
      else utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Offline TTS failed to speak query:", e);
    }
  };

  const startVoiceDictation = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Web Speech dictation is disabled in this browser. Try Chrome/Safari.");
        return;
      }
      
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      if (language === 'ta') rec.lang = 'ta-IN';
      else if (language === 'hi') rec.lang = 'hi-IN';
      else if (language === 'uk') rec.lang = 'uk-UA';
      else if (language === 'ar') rec.lang = 'ar-SA';
      else rec.lang = 'en-US';

      rec.onstart = () => {
        setIsDictating(true);
      };
      
      rec.onresult = (event: any) => {
        const textOutput = event.results[0][0].transcript;
        setUserInput(textOutput);
      };

      rec.onerror = (e: any) => {
        console.warn("Dictation failed:", e);
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      rec.start();
    } catch (e) {
      console.warn("Speech API failure:", e);
    }
  };

  // Helper icons mapper
  const renderAgentIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'Shield': return <Shield className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'Package': return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'Flame': return <Flame className="w-4 h-4 text-red-500 shrink-0" />;
      default: return <Bot className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div id="ai-assistant-container" className="space-y-4 my-4 select-none">
      
      {/* Header controls */}
      <div id="ai-control-layout" className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-805 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">Module 4 — Hybrid Dual-Agent Artificial Intelligence</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Triage medical, shelter routing, and survival parameters fully offline.</p>
        </div>

        {/* Global Language Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider">Lang:</span>
          <select
            id="ai-language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value as AppLanguage)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold px-2 py-1 rounded text-xs focus:outline-none cursor-pointer"
          >
            <option value="en">English (US)</option>
            <option value="uk">Ukrainian (Українська)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="ar">Arabic (العربية)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[65vh]">
        
        {/* Main Smart Conversation Frame */}
        <div className="md:col-span-2 border rounded-xl flex flex-col justify-between bg-slate-950/20 border-zinc-800 h-full">
          
          {/* Active Model Indicator Header */}
          <div className="p-3 border-b border-zinc-800 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Phi-3 quantized on-device core</span>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-sky-500' : 'bg-emerald-500'}`} />
              <span>{isOnline ? 'Satellite Hybrid Mode (Gemini Active)' : 'Local Core (Backup Active)'}</span>
            </div>
          </div>

          {/* Dialog Log panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {aiHistory.map((bubble, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[90%] ${bubble.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                id={`ai-history-bubble-${idx}`}
              >
                {/* Agent Icon */}
                {bubble.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center shrink-0">
                    {renderAgentIcon(bubble.agentIcon)}
                  </div>
                )}

                <div className={`p-3 rounded-lg border leading-relaxed ${
                  bubble.sender === 'user' 
                    ? 'bg-slate-900 border-slate-800 text-slate-100 font-medium' 
                    : 'bg-zinc-950 border-zinc-805 text-zinc-300'
                }`}>
                  {bubble.agentName && (
                    <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-805/30 pb-1 mb-1.5">
                      Agent: {bubble.agentName}
                    </div>
                  )}

                  {/* Manual Simple MD processor */}
                  <div className="space-y-2 whitespace-pre-line">
                    {bubble.text}
                  </div>
                  
                  {bubble.sender === 'ai' && (
                    <button
                      id={`tts-play-bubble-btn-${idx}`}
                      onClick={() => speakResponse(bubble.text)}
                      className="mt-2 text-zinc-500 hover:text-emerald-400 font-bold uppercase text-[9px] font-mono tracking-widest flex items-center gap-1 cursor-pointer"
                      title="Convert AI message to local speech audio"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak voice back</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] p-2 pl-12">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Specialist Agent executing analytical sequence...</span>
              </div>
            )}
          </div>

          {/* Action Input bar */}
          <div className="p-3 bg-slate-900/30 border-t border-zinc-850 flex gap-2 items-center">
            
            {/* Direct voice dictation trigger */}
            <button
              id="voice-dictation-btn"
              onClick={startVoiceDictation}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                isDictating 
                  ? 'bg-red-950/40 border-red-800 text-red-500 animate-pulse' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Dictate message offline using Web Speech recognition"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              id="ai-prompt-input-field"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder={isDictating ? "Listening dictation..." : "Ask MedAgent CPR step, or SurvivalAgent shelters guides..."}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 text-zinc-100"
            />

            <button
              id="submit-ai-prompt-btn"
              onClick={handleSend}
              disabled={!userInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-lg disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Local Knowledge base Accordion Sidebar */}
        <div id="ai-knowledgebase-sidebar" className="border rounded-xl p-3 bg-slate-950/20 border-zinc-805 overflow-y-auto flex flex-col gap-3 h-full">
          <div>
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Offline Knowledge-Base</span>
            </h4>
            <p className="text-[10px] text-zinc-500 mt-1">50 common first aids & 20 survival protocols preloaded immediately.</p>
          </div>

          {/* Caching status widget */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5" id="caching-status-panel">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-zinc-400 font-bold">Phi-3 Model weights:</span>
              <span className="font-semibold text-emerald-400">
                {downloadProgress === null ? 'Inactive' : downloadProgress >= 100 ? '✅ Buffered' : `${downloadProgress}%`}
              </span>
            </div>

            {downloadProgress === null ? (
              <button
                id="pre-cache-model-btn"
                onClick={startModelDownload}
                className="w-full bg-zinc-900/90 border border-zinc-800 hover:text-white text-[10px] font-mono leading-none mt-2 py-1.5 rounded font-bold transition-all text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                Pre-load LLM (500MB)
              </button>
            ) : downloadProgress < 100 ? (
              <div className="w-full bg-zinc-900 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WebGPU Cached Local Core Running</span>
              </div>
            )}
          </div>

          {/* Emergency contacts fast readout */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">S.O.S Emergency Contacts</span>
            {EMERGENCY_CONTACTS.map((con, idx) => (
              <div key={idx} className="bg-zinc-950/40 p-2 rounded border border-zinc-900 flex justify-between items-center">
                <div>
                  <div className="font-bold text-[10px] text-zinc-400 leading-tight">{con.label}</div>
                  <div className="text-[9px] text-zinc-550 truncate max-w-[150px]">{con.description}</div>
                </div>
                <span className="font-mono font-bold text-xs text-rose-400">{con.number}</span>
              </div>
            ))}
          </div>

          {/* Expandable survival list */}
          <div className="space-y-1.5 flex-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Failsafe Survival Guidelines</span>
            
            {SURVIVAL_GUIDES.map((g) => {
              const isExpanded = expandedGuideId === g.id;
              const guideTitle = g.title[language] || g.title['en'];
              const guideSteps = g.steps[language] || g.steps['en'];

              return (
                <div key={g.id} className="border border-zinc-900 rounded bg-zinc-950/40 overflow-hidden text-xs">
                  <button
                    id={`toggle-guide-btn-${g.id}`}
                    onClick={() => setExpandedGuideId(isExpanded ? null : g.id)}
                    className="w-full text-left p-2 flex justify-between items-center font-bold text-[11px] text-zinc-300 hover:text-white"
                  >
                    <span className="truncate pr-2">{guideTitle}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="p-2 border-t border-zinc-900 bg-zinc-950/80 text-[10px] leading-relaxed text-zinc-400 space-y-1.5" id={`guide-rendered-body-${g.id}`}>
                      {guideSteps.map((st, sidx) => (
                        <div key={sidx} className="flex gap-1.5">
                          <span className="font-bold text-emerald-400">{sidx + 1}.</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
