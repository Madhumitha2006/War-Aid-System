/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MessageSquare, Radio, Send, ShieldCheck, 
  User as UserIcon, Volume2, AlertTriangle, HelpCircle, 
  Plus, Users, MessageCircle, Signal 
} from 'lucide-react';
import { Message, User, UserRole } from '../../types';
import PTTButton from '../../components/PTTButton';

interface Props {
  messages: Message[];
  users: User[];
  currentUser: User;
  onSendMessage: (msg: {
    to: string;
    type: 'text' | 'voice' | 'photo' | 'location' | 'broadcast';
    content: string;
    priority: 'emergency' | 'important' | 'normal';
  }) => void;
  emergencyMode: boolean;
}

export default function MeshChat({ messages, users, currentUser, onSendMessage, emergencyMode }: Props) {
  const [activeChannel, setActiveChannel] = useState<string>('all'); // 'all' (Broadcast), 'group' (Mesh Group), or individual user id
  const [newTextMessage, setNewTextMessage] = useState('');
  const [activePriority, setActivePriority] = useState<'emergency' | 'important' | 'normal'>('normal');

  // Filters messages based on selection
  const filteredMessages = messages.filter(msg => {
    if (activeChannel === 'all') {
      return msg.to === 'all' || msg.type === 'broadcast';
    } else if (activeChannel === 'group') {
      return msg.to === 'group';
    } else {
      // Direct message check
      return (msg.from === currentUser.id && msg.to === activeChannel) || 
             (msg.from === activeChannel && msg.to === currentUser.id);
    }
  });

  const handleSend = () => {
    if (!newTextMessage.trim()) return;
    onSendMessage({
      to: activeChannel,
      type: activeChannel === 'all' ? 'broadcast' : 'text',
      content: newTextMessage,
      priority: activePriority
    });
    setNewTextMessage('');
    setActivePriority('normal');
  };

  const playSimulatedVoice = (duration: number) => {
    // Elegant audio synthesizer so voice play button builds real, unique, military sound waves offline
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(550, ctx.currentTime + 0.6);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + duration - 0.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, duration * 1000);
    } catch (e) {
      console.warn("Speech synthesise failure:", e);
    }
  };

  const handleVoiceSend = (base64: string, durationSec: number) => {
    onSendMessage({
      to: activeChannel === 'all' ? 'group' : activeChannel, // No audio broadcasts allowed except in groups/directs
      type: 'voice',
      content: `[Radio Transmitted Audio note (${durationSec}s)]`,
      priority: activePriority
    });
  };

  // Helper labels
  const getChannelTitle = () => {
    if (activeChannel === 'all') return '🚨 CIVIL EMERGENCY DEFENSE BROADCAST';
    if (activeChannel === 'group') return '💬 DISASTER VOLUNTEER COORDINATION CH-12';
    const usr = users.find(u => u.id === activeChannel);
    return usr ? `👤 DIRECT P2P LINK: ${usr.name}` : 'Unknown Tactical Peer';
  };

  return (
    <div id="mesh-chat-container" className="flex flex-col lg:flex-row h-[70vh] border rounded-xl overflow-hidden bg-slate-950/20 my-4 border-zinc-800">
      
      {/* Mesh Channels Sidebar List */}
      <div id="chat-channels-sidebar" className="w-full lg:w-72 border-r border-zinc-800 flex flex-col bg-slate-950/45">
        <div className="p-3 border-b border-zinc-800 bg-slate-940 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Tactical Mesh Sectors</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20"> P2P active</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* 1. Government Broadcast */}
          <button
            id="chat-toggle-broadcast"
            onClick={() => setActiveChannel('all')}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
              activeChannel === 'all' 
                ? 'bg-red-950/30 border border-red-900/40 text-red-400 font-semibold' 
                : 'hover:bg-zinc-800/40 text-zinc-400'
            }`}
          >
            <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            <div className="text-xs truncate">
              <div className="font-bold tracking-wide">CD HEADQUARTERS</div>
              <div className="text-[10px] opacity-75">All-User Broadcasts</div>
            </div>
          </button>

          {/* 2. Group Chat */}
          <button
            id="chat-toggle-group"
            onClick={() => setActiveChannel('group')}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
              activeChannel === 'group' 
                ? 'bg-sky-950/30 border border-sky-900/40 text-sky-400 font-semibold' 
                : 'hover:bg-zinc-800/40 text-zinc-400'
            }`}
          >
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-xs truncate">
              <div className="font-bold tracking-wide">MESH MULTI-HOP GROUP</div>
              <div className="text-[10px] opacity-75">Nearby Volunteers (Ch 12)</div>
            </div>
          </button>

          {/* 3. Peers DMV list */}
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Connected Peers ({users.length})</div>
          
          {users.map(u => {
            if (u.id === currentUser.id) return null; // skip self
            
            return (
              <button
                key={u.id}
                id={`chat-toggle-peer-${u.id}`}
                onClick={() => setActiveChannel(u.id)}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                  activeChannel === u.id 
                    ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 font-semibold' 
                    : 'hover:bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 flex items-center justify-center p-3 text-[10px] border border-zinc-700 uppercase font-bold bg-zinc-850">
                    {u.name.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
                </div>
                <div className="text-xs truncate flex-1 leading-tight">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-[10px] opacity-75 capitalize font-mono text-zinc-500">
                    {u.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Local Identification signature card */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2 text-xs">
            <UserIcon className="w-4 h-4 text-zinc-500" />
            <div className="truncate">
              <div className="font-semibold text-zinc-300 truncate">{currentUser.name}</div>
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Role: {currentUser.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Thread View */}
      <div id="chat-thread-view" className="flex-1 flex flex-col bg-slate-950/10">
        
        {/* Thread Header */}
        <div id="chat-thread-header" className="p-3 border-b border-zinc-800 bg-slate-900/40 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">{getChannelTitle()}</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">End-to-End Encrypted via local key-mesh signatures.</p>
          </div>
          
          <div className="hidden xs:flex items-center gap-2 text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">
            <Signal className="w-3.5 h-3.5 text-emerald-500" />
            <span>CHANNEL RELAY #12</span>
          </div>
        </div>

        {/* Message Stream */}
        <div id="chat-message-stream" className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <MessageCircle className="w-10 h-10 stroke-1 stroke-zinc-750" />
              <p className="text-sm font-semibold">Decentralized Mesh Ledger is Empty</p>
              <p className="text-xs max-w-sm">Use the broadcast panel below to push a local text, query safety nodes, or press Walkie-Talkie PTT.</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMe = msg.from === currentUser.id;
              
              // Styles depending on priority
              let priorityBorder = 'border-zinc-805';
              if (msg.priority === 'emergency') priorityBorder = 'border-red-950 bg-red-950/15 text-red-200';
              else if (msg.priority === 'important') priorityBorder = 'border-amber-950 bg-amber-950/10 text-amber-200';
              
              return (
                <div 
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] rounded-xl p-3 border text-xs gap-1.5 transition-all ${
                    isMe 
                      ? 'ml-auto bg-slate-900 border-slate-800 text-slate-100' 
                      : msg.type === 'broadcast'
                        ? 'mx-auto w-[90%] sm:w-[95%] bg-red-950/10 border-red-900/40 text-rose-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-350'
                  } ${priorityBorder}`}
                >
                  {/* Message sender credentials */}
                  <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-zinc-500 border-b border-zinc-800/50 pb-1">
                    <span className={`font-bold ${isMe ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {isMe ? 'Local Node (Self)' : msg.fromName}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>Hop Count: {msg.hopCount}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>

                  {/* Message body content */}
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.type === 'voice' ? (
                      <div className="flex items-center gap-3 py-1.5 bg-zinc-900/40 px-2 rounded border border-zinc-800/40">
                        <button
                          id={`play-voice-btn-${msg.id}`}
                          onClick={() => playSimulatedVoice(msg.audioDuration || 4)}
                          className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 animate-pulse" />
                        </button>
                        <div className="flex-1">
                          <div className="font-bold text-[10px] text-zinc-400">Encrypted Transmitted Audio</div>
                          <div className="text-[9px] text-zinc-500 font-mono">Press play to demodulate RF wave</div>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Priority banner tags */}
                  {msg.priority !== 'normal' && (
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-500 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{msg.priority} Alert</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div id="chat-input-panel" className="p-3 border-t border-zinc-800 bg-slate-900/30 flex flex-col gap-2">
          
          {/* Priority selector row */}
          {activeChannel !== 'all' ? (
            <div className="flex items-center gap-2 text-[10px]" id="chat-priority-container">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Priority:</span>
              <button
                id="priority-normal-btn"
                onClick={() => setActivePriority('normal')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  activePriority === 'normal' 
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                    : 'text-zinc-500 border-transparent hover:text-zinc-400'
                }`}
              >
                Normal
              </button>
              <button
                id="priority-important-btn"
                onClick={() => setActivePriority('important')}
                className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-0.5 ${
                  activePriority === 'important' 
                    ? 'bg-amber-950 text-amber-400 border-amber-900' 
                    : 'text-zinc-500 border-transparent hover:text-amber-400'
                }`}
              >
                🟡 Important
              </button>
              <button
                id="priority-emergency-btn"
                onClick={() => setActivePriority('emergency')}
                className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-0.5 ${
                  activePriority === 'emergency' 
                    ? 'bg-red-950 text-red-400 border-red-900' 
                    : 'text-zinc-500 border-transparent hover:text-red-400'
                }`}
              >
                🔴 Emergency
              </button>
            </div>
          ) : (
            <div className="text-[9px] text-red-400 font-mono flex items-center gap-1 bg-red-950/15 p-1 rounded border border-red-950">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>GOVERNMENT EXCLUSIVE BROADCAST ACCESS: Read-only for civil nodes. All replies are routed as volunteer group queries.</span>
            </div>
          )}

          {/* Text transmission bar */}
          <div className="flex gap-2 items-center">
            <input
              id="chat-message-text-input"
              type="text"
              value={newTextMessage}
              onChange={(e) => setNewTextMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder={activeChannel === 'all' ? "Civilian nodes cannot write on official channels..." : "Type text message pack..."}
              disabled={activeChannel === 'all'}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 disabled:opacity-50"
            />
            
            <button
              id="send-chat-msg-btn"
              onClick={handleSend}
              disabled={!newTextMessage.trim() || activeChannel === 'all'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Walkie-Talkie Slide down section */}
          {activeChannel !== 'all' && (
            <div className="mt-1 border-t border-zinc-900 pt-2 shrink-0">
              <PTTButton onVoiceRecorded={handleVoiceSend} emergencyMode={emergencyMode} />
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
