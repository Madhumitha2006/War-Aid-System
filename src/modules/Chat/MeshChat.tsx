/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MessageSquare, Radio, Send, ShieldCheck, 
  User as UserIcon, Volume2, AlertTriangle, HelpCircle, 
  Plus, Users, MessageCircle, Signal,
  Phone, ExternalLink, Trash2, Smartphone, Share2, Sparkles,
  ArrowLeft, ChevronRight, Lock, ChevronDown, Check
} from 'lucide-react';
import { Message, User, UserRole } from '../../types';
import PTTButton from '../../components/PTTButton';
import { appStore } from '../../store/appStore';

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
  const [activeChannel, setActiveChannel] = useState<string | null>(null); // null (Chats ledger menu), 'all' (Broadcast), 'group' (Mesh Group), 'sms-bridge' (Carrier SMS Gateway), or individual user id
  const [showContactManager, setShowContactManager] = useState(false);
  const [sendViaTwilio, setSendViaTwilio] = useState(false);
  const [newTextMessage, setNewTextMessage] = useState('');
  const [activePriority, setActivePriority] = useState<'emergency' | 'important' | 'normal'>('normal');

  // Carrier Outbound SMS Directory & Dispatcher States
  const [smsContacts, setSmsContacts] = useState<{ id: string; name: string; phone: string; countryCode: string; label: string }[]>(() => {
    const saved = localStorage.getItem('waraid_sms_contacts_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultContacts = [
      { id: 'contact-ndrf', name: 'National Disaster Response Force (NDRF)', phone: '01123438009', countryCode: '+91', label: 'Gov Control' },
      { id: 'contact-redcross', name: 'Indian Red Cross Society HQ', phone: '9810203040', countryCode: '+91', label: 'Medical Relief' },
      { id: 'contact-sdma', name: 'State Emergency Operations Center', phone: '1070', countryCode: '+91', label: 'Disaster Desk' },
      { id: 'contact-helpline', name: 'National Distress Helpline', phone: '112', countryCode: '+91', label: 'Emergency Core' }
    ];
    localStorage.setItem('waraid_sms_contacts_v2', JSON.stringify(defaultContacts));
    return defaultContacts;
  });

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLabel, setContactLabel] = useState('Emergency Contact');
  const [contactCC, setContactCC] = useState('+91');
  
  const [draftMessage, setDraftMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string>('contact-ndrf');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'simulating' | 'success'>('idle');
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);

  // Live Carrier SMS routing states
  const [smsErrorMessage, setSmsErrorMessage] = useState<string | null>(null);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState<string | null>(null);
  const [smsSendingStatus, setSmsSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Immersive In-App Mobile Simulator States & Threads
  interface SimulationMsg {
    id: string;
    sender: 'me' | 'them';
    text: string;
    timestamp: string;
    networkMode: 'online' | 'offline';
    channelType: 'sms';
    status?: 'sent' | 'delivered';
  }

  const [simThreads, setSimThreads] = useState<Record<string, SimulationMsg[]>>(() => {
    const saved = localStorage.getItem('waraid_sim_threads_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultThreads: Record<string, SimulationMsg[]> = {
      'contact-ndrf': [
        { id: '1', sender: 'them', text: '🚨 NDRF emergency desk activated. State your tactical grid coordinate, responder count, and resource levels.', timestamp: '10:02 AM', networkMode: 'online', channelType: 'sms', status: 'delivered' },
        { id: '2', sender: 'me', text: 'Heavy precipitation in Sector 4. Standard local cellular infrastructure has collapsed. Broadcast online via local backhaul mesh nodes.', timestamp: '10:15 AM', networkMode: 'online', channelType: 'sms', status: 'delivered' },
        { id: '3', sender: 'them', text: 'Acknowledged. Telemetry matched. Keep the satellite RF uplink online.', timestamp: '10:16 AM', networkMode: 'online', channelType: 'sms', status: 'delivered' }
      ],
      'contact-redcross': [
        { id: '1', sender: 'them', text: 'Red Cross dispatch unit is online. Salt hydration packs and mobile trauma kits standard ready. Provide route feedback.', timestamp: '09:40 AM', networkMode: 'online', channelType: 'sms', status: 'delivered' }
      ]
    };
    localStorage.setItem('waraid_sim_threads_v3', JSON.stringify(defaultThreads));
    return defaultThreads;
  });

  const [simNetworkMode, setSimNetworkMode] = useState<'online' | 'offline'>('online');

  const saveContactsLocal = (updatedList: typeof smsContacts) => {
    setSmsContacts(updatedList);
    localStorage.setItem('waraid_sms_contacts_v2', JSON.stringify(updatedList));
  };

  const saveSimThreadsLocal = (updatedThreads: Record<string, SimulationMsg[]>) => {
    setSimThreads(updatedThreads);
    localStorage.setItem('waraid_sim_threads_v3', JSON.stringify(updatedThreads));
  };

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim() || !contactName.trim()) return;
    const cleanCC = contactCC.startsWith('+') ? contactCC : `+${contactCC}`;
    const newContact = {
      id: `contact-${Date.now()}`,
      name: contactName.trim(),
      phone: contactPhone.trim().replace(/\s+/g, '').replace(/[-()]/g, ''),
      countryCode: cleanCC,
      label: contactLabel.trim() || 'General'
    };
    const updated = [newContact, ...smsContacts];
    saveContactsLocal(updated);
    setSelectedContactId(newContact.id);
    
    // Log telemetry
    appStore.addLog(`[CARRIER SMS]: Added new response phone contact: ${newContact.name} (${newContact.countryCode} ${newContact.phone})`);
    
    // Reset inputs
    setContactName('');
    setContactPhone('');
    setContactLabel('Emergency Contact');
  };

  const handleDeleteContact = (id: string, name: string) => {
    const updated = smsContacts.filter(c => c.id !== id);
    saveContactsLocal(updated);
    if (selectedContactId === id && updated.length > 0) {
      setSelectedContactId(updated[0].id);
    }
    appStore.addLog(`[CARRIER SMS]: Removed response mobile contact: ${name}`);
  };

  const handleApplyPresetText = (preset: string) => {
    setDraftMessage(preset);
  };

  // High fidelity notification chime generator
  const playNotifySound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.25);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 400);
    } catch (e) {
      console.warn("Speech synthesis beep failure:", e);
    }
  };

  // Automated responder generation logic
  const generateAutoResponse = (incomingText: string, contactName: string): string => {
    const text = incomingText.toLowerCase();
    if (text.includes('sos') || text.includes('emerg') || text.includes('rescue') || text.includes('help')) {
      return `🚨 [ALERT CONFIRMED] - Simulated responder desk for ${contactName} acknowledged emergency alarm. Ground dispatch is reviewing sector grid coordinates. Standby.`;
    }
    if (text.includes('food') || text.includes('supply') || text.includes('ration') || text.includes('water')) {
      return `📦 [LOGISTICS DIV] - ${contactName} allocation team approved your request. Ration packets, bottled saline water, and tents queued under track tag.`;
    }
    if (text.includes('medic') || text.includes('hospital') || text.includes('doctor') || text.includes('injury') || text.includes('hurt')) {
      return `💊 [HEALTH RESPONSE] - Inbuilt responder triage division notified for ${contactName}. Direct first aid kits and emergency drone set to deploy.`;
    }
    return `✅ [RECEIVED] - Simulated dispatcher at ${contactName} received packet. Direct communication line intact via dual-channel simulation. Stay safe coordinate node.`;
  };

  const triggerSimulatedReply = (contact: typeof smsContacts[0], originalText: string) => {
    const replyText = generateAutoResponse(originalText, contact.name);
    const replyMsg: SimulationMsg = {
      id: `sim-msg-reply-${Date.now()}`,
      sender: 'them',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      networkMode: simNetworkMode,
      channelType: 'sms',
      status: 'delivered'
    };

    setSimThreads(prev => {
      const current = prev[contact.id] || [];
      const updated = [...current, replyMsg];
      const newState = { ...prev, [contact.id]: updated };
      localStorage.setItem('waraid_sim_threads_v3', JSON.stringify(newState));
      return newState;
    });

    playNotifySound();
    appStore.addLog(`[CELLULAR BRIDGE]: Simulated inbound reply received from standard phone ${contact.countryCode} ${contact.phone} (${contact.name})`);
  };

  const handleSimulateInbuiltDispatch = (textToSend: string) => {
    const finalMsgText = textToSend.trim();
    if (!finalMsgText) return;

    const contact = smsContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const finalPhoneNum = `${contact.countryCode} ${contact.phone}`;
    
    // Create new message object
    const newMsgId = `sim-msg-${Date.now()}`;
    const newMsg: SimulationMsg = {
      id: newMsgId,
      sender: 'me',
      text: finalMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      networkMode: simNetworkMode,
      channelType: 'sms',
      status: simNetworkMode === 'online' ? 'delivered' : 'sent'
    };

    // Update thread locally
    const currentThread = simThreads[selectedContactId] || [];
    const updatedThread = [...currentThread, newMsg];
    const newThreadsState = {
      ...simThreads,
      [selectedContactId]: updatedThread
    };
    saveSimThreadsLocal(newThreadsState);

    // If online, send immediately. If offline, run simulated logs loading before delivery
    if (simNetworkMode === 'online') {
      setDispatchStatus('success');
      setSimulatedLog([
        '🟢 Dispatching packet instantly via local cellular mast GSM gateway...',
        `📲 Message delivered to standard mobile phone receiver: ${finalPhoneNum}`,
        `📦 Registered to live SMS payload carrier stream.`,
        '💡 In-App Simulated Transceiver: Transmission processed successfully inside sandboxed RF ledger!',
      ]);
      
      // Inject to local civil ledger
      onSendMessage({
        to: 'group',
        type: 'text',
        content: `📲 [Direct Cellular SMS to ${contact.name} (${finalPhoneNum})]:\n\n${finalMsgText}`,
        priority: 'normal'
      });
      appStore.addLog(`[CELLULAR BRIDGE]: Delivered direct SMS to standard mobile target: ${finalPhoneNum}`);

      // Auto response trigger after 1.5s
      setTimeout(() => {
        triggerSimulatedReply(contact, finalMsgText);
      }, 1500);

    } else {
      // OFFLINE - satellite and mesh hops
      setDispatchStatus('simulating');
      setSimulatedLog([
        '⚡ Off-Grid Mode Active: cellular tower infrastructure unavailable.',
        '📡 Locating nearest active LoRA node or RF relay hop peer...',
        `🔗 Multi-hop path identified: Local Node -> Volunteer Relay Node #2 -> Satellite Base-station`,
        '📦 Compressing payload into robust 140-byte tactical GSM frame...',
      ]);

      setTimeout(() => {
        setSimulatedLog(prev => [
          ...prev,
          '🚀 Intermittent low-earth orbit satellite transponder connection verified.',
          '📡 Uplinking tactical package over proprietary RF frequencies...'
        ]);
      }, 1200);

      setTimeout(() => {
        setSimulatedLog(prev => [
          ...prev,
          `✅ Off-Grid Satellite Dispatch Completed! Broadcast delivered to: ${finalPhoneNum}`,
          '💡 In-App Simulated Transceiver: Satellite hop successfully integrated over sandboxed radio terminal.'
        ]);
        setDispatchStatus('success');

        // Update message status inside history to 'delivered' now that it made the hop
        setSimThreads(currentList => {
          const current = currentList[selectedContactId] || [];
          const updated = current.map(m => m.id === newMsgId ? { ...m, status: 'delivered' as const } : m);
          const newState = { ...currentList, [selectedContactId]: updated };
          localStorage.setItem('waraid_sim_threads_v3', JSON.stringify(newState));
          return newState;
        });

        // Inject to local civil ledger
        onSendMessage({
          to: 'group',
          type: 'text',
          content: `🛰️ [Satellite Off-Grid SMS Relay to ${contact.name} (${finalPhoneNum})]:\n\n${finalMsgText}`,
          priority: 'important'
        });
        appStore.addLog(`[SATELLITE BRIDGE]: Off-Grid relay successfully hopped packet to standard mobile number: ${finalPhoneNum}`);

        // Off-grid Response trigger after 2s
        setTimeout(() => {
          triggerSimulatedReply(contact, finalMsgText);
        }, 2000);

      }, 2400);
    }
  };

  const handleRealSMSDispatch = async () => {
    const contact = smsContacts.find(c => c.id === selectedContactId);
    if (!contact) {
      setSmsErrorMessage("Target directory entry not found. Please add or select a contact.");
      setSmsSendingStatus('error');
      return;
    }
    const finalMsgText = draftMessage.trim();
    if (!finalMsgText) {
      setSmsErrorMessage("Draft message is empty. Please type a message or select a preset.");
      setSmsSendingStatus('error');
      return;
    }

    setSmsSendingStatus('sending');
    setSmsErrorMessage(null);
    setSmsSuccessMessage(null);

    // Prepare simulated preview message block
    const newMsgId = `real-sms-msg-${Date.now()}`;
    const newMsg: SimulationMsg = {
      id: newMsgId,
      sender: 'me',
      text: finalMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      networkMode: 'online',
      channelType: 'sms',
      status: 'sent'
    };

    try {
      const fullPhoneNumber = `${contact.countryCode}${contact.phone}`.replace(/\s+/g, '').replace(/\+/g, '');
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: `+${fullPhoneNumber}`,
          body: finalMsgText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSmsSendingStatus('success');
        setSmsSuccessMessage(`SMS success! Dispatch ID: ${data.sid}`);
        appStore.addLog(`[LIVE CARRIER DISPATCH]: SMS delivered to +${fullPhoneNumber} successfully! Status=${data.status}`);

        // Inject inside our device's messaging historical stream
        setSimThreads(currentList => {
          const current = currentList[selectedContactId] || [];
          const updatedMsg = { ...newMsg, status: 'delivered' as const };
          const updated = [...current, updatedMsg];
          const newState = { ...currentList, [selectedContactId]: updated };
          localStorage.setItem('waraid_sim_threads_v3', JSON.stringify(newState));
          return newState;
        });

        // Blank input
        setDraftMessage('');

        onSendMessage({
          to: 'group',
          type: 'text',
          content: `🟢 [LIVE SMS DISPATCH SUCCESS]: To ${contact.name} (+${fullPhoneNumber}):\n\n${finalMsgText}`,
          priority: 'important'
        });

      } else {
        setSmsSendingStatus('error');
        setSmsErrorMessage(data.message || `Outbound dispatch error: ${data.error}`);
        appStore.addLog(`[LIVE CARRIER DISPATCH ACTION FAIL]: ${data.message || data.error}`);
      }
    } catch (err: any) {
      setSmsSendingStatus('error');
      setSmsErrorMessage(`Real-time network gateway driver is offline: ${err.message}`);
      appStore.addLog(`[LIVE CARRIER ERROR]: ${err.message}`);
    }
  };

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
      to: activeChannel === null ? 'group' : activeChannel,
      type: 'text',
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
      to: activeChannel === 'all' || activeChannel === null ? 'group' : activeChannel, // No audio broadcasts allowed except in groups/directs
      type: 'voice',
      content: `[Radio Transmitted Audio note (${durationSec}s)]`,
      priority: activePriority
    });
  };

  // Helper labels
  const getChannelTitle = () => {
    if (activeChannel === 'all') return '📡 CIVIL EMERGENCY DEFENSE BROADCAST';
    if (activeChannel === 'group') return '💬 DISASTER VOLUNTEER COORDINATION CH-12';
    if (activeChannel === 'sms-bridge') return '⚡ REAL CARRIER SMS DISPATCH GATEWAY';
    const usr = users.find(u => u.id === activeChannel);
    return usr ? `👤 DIRECT P2P LINK: ${usr.name}` : 'Unknown Tactical Peer';
  };

  return (
    <div id="mesh-chat-container" className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      
      {activeChannel === null ? (
        /* ================== CHATS LOBBY VIEWER (MINIMAL LOOK) ================== */
        <div id="chats-lobby-view" className="flex-1 flex flex-col overflow-hidden bg-transparent">
          
          {/* Sector Registry Title Header */}
          <div className="px-4 py-3.5 border-b border-zinc-900/40 bg-zinc-950/20 flex items-center justify-between shrink-0">
            <div>
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400 block font-semibold">Active Backhaul Nodes</span>
              <p className="text-[9px] font-mono text-zinc-600 lowercase tracking-tight leading-none mt-0.5">sector grid kyiv_dm_12</p>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 border border-emerald-500/15 rounded-full flex items-center gap-1 font-bold">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              MESH READY
            </span>
          </div>

          {/* Core Channels Scroll viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-0">
            <span className="block text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">Network Channels</span>

            {/* 1. CD Headquarters Broadcast */}
            <button
              id="lobby-chan-all"
              onClick={() => setActiveChannel('all')}
              className="w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all border border-zinc-900/40 bg-zinc-950/30 hover:bg-zinc-900/40 hover:border-zinc-800 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-955/25 border border-red-900/30 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[11px] font-mono text-zinc-200 block tracking-wide">CD HEADQUARTERS</span>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">Emergency alerts & broadcasts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {/* 2. Group Multi-hop channel */}
            <button
              id="lobby-chan-group"
              onClick={() => setActiveChannel('group')}
              className="w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all border border-zinc-900/40 bg-zinc-950/30 hover:bg-zinc-900/40 hover:border-zinc-800 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-950/20 border border-sky-900/30 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[11px] font-mono text-zinc-200 block tracking-wide">MESH MULTI-HOP GROUP</span>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">Nearby volunteer coordinators (Ch 12)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {/* 3. Carrier SMS Mobile bridge */}
            <button
              id="lobby-chan-sms"
              onClick={() => {
                setActiveChannel('sms-bridge');
                setDispatchStatus('idle');
              }}
              className="w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all border border-zinc-900/40 bg-zinc-950/30 hover:bg-zinc-900/40 hover:border-zinc-800 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-955/15 border border-emerald-900/30 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[11px] font-mono text-zinc-200 tracking-wide">CARRIER SMS BRIDGE</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] font-bold px-1 rounded-full scale-90">LIVE</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">Simulate or route SMS to real phones</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>

            {/* 4. Peers Listing section */}
            <div className="pt-3 pb-1">
              <span className="block text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">Nearby Peer Nodes ({users.length})</span>
            </div>

            {users.map(u => {
              if (u.id === currentUser.id) return null;
              return (
                <button
                  key={u.id}
                  id={`lobby-peer-${u.id}`}
                  onClick={() => setActiveChannel(u.id)}
                  className="w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all border border-zinc-900/20 bg-zinc-950/20 hover:bg-zinc-900/40 hover:border-zinc-800/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-900/60 border border-zinc-805 flex items-center justify-center text-[10px] uppercase font-mono font-bold text-zinc-400">
                        {u.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-[11px] text-zinc-200 block">{u.name}</span>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide capitalize mt-0.5">{u.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Current Local Persona footer block card */}
          <div className="p-3.5 border-t border-zinc-900 bg-zinc-950/30 shrink-0">
            <div className="flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-900/60 flex items-center justify-center shrink-0 border border-zinc-850">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-zinc-300 truncate text-[11px]">{currentUser.name}</div>
                  <div className="text-[9px] font-mono text-zinc-650 uppercase tracking-wider leading-none mt-0.5 font-bold">local signature terminal</div>
                </div>
              </div>
              <span className="bg-zinc-900 text-zinc-400 text-[8px] font-mono px-2 py-0.5 rounded border border-zinc-800 uppercase shrink-0 font-bold">
                {currentUser.role}
              </span>
            </div>
          </div>

        </div>
      ) : (
        /* ================== ACTIVE CONVERSATION COMPANION VIEW ================== */
        <div id="chats-conversation-view" className="flex-1 flex flex-col overflow-hidden bg-transparent">
          
          {/* Thread Header Bar */}
          <div className="px-3 py-2.5 border-b border-zinc-900/40 bg-zinc-950/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 leading-tight">
              <button
                id="active-chat-back-btn"
                onClick={() => {
                  setActiveChannel(null);
                  setShowContactManager(false);
                }}
                className="p-1 px-1.5 -ml-1 rounded-lg hover:bg-zinc-900/60 text-zinc-400 hover:text-white transition-all shrink-0 flex items-center gap-0.5 font-bold select-none text-[10px] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="border-l border-zinc-850 h-5 my-auto shrink-0 mx-0.5" />
              <div className="min-w-0">
                <span className="font-mono font-bold text-[10.5px] uppercase tracking-wide text-zinc-250 block truncate leading-tight">
                  {getChannelTitle().replace('📡 ', '').replace('💬 ', '').replace('⚡ ', '').replace('👤 ', '')}
                </span>
                <span className="text-[8px] text-zinc-500 tracking-tight leading-none block font-mono mt-0.5 uppercase">
                  {activeChannel === 'sms-bridge' ? 'carrier cell simulation gateway' : 'mesh point encrypted relay link'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase">CH-12</span>
            </div>
          </div>

          {/* Render Body of active channel */}
          {activeChannel === 'sms-bridge' ? (
            /* SMS BRIDGE CHANNEL COMPACT CELL-VIEW VIEWPORT */
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-zinc-950/40 font-sans">
              
              {/* Dynamic Sub-header Contact selection strip */}
              <div className="bg-zinc-950/50 p-2 border-b border-zinc-900/40 flex items-center justify-between gap-1 shrink-0 font-sans">
                {/* Active contact dropdown button */}
                {(() => {
                  const activeContact = smsContacts.find(c => c.id === selectedContactId) || smsContacts[0];
                  return (
                    <button
                      type="button"
                      onClick={() => setShowContactManager(!showContactManager)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-900 text-left cursor-pointer min-w-0"
                    >
                      <UserIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                      <div className="truncate min-w-0 max-w-[155px] leading-tight">
                        <span className="text-[10px] font-bold block text-zinc-250 truncate">{activeContact ? activeContact.name : 'Choose contact'}</span>
                        <span className="text-[8px] font-mono block text-zinc-500">{activeContact ? `${activeContact.countryCode} ${activeContact.phone}` : ''}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-zinc-505 shrink-0" />
                    </button>
                  );
                })()}

                {/* Satellite vs Online Toggle pill */}
                <button
                  type="button"
                  onClick={() => setSimNetworkMode(simNetworkMode === 'online' ? 'offline' : 'online')}
                  className={`px-2 py-1 rounded-full text-[8px] font-mono font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                    simNetworkMode === 'online'
                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-450'
                      : 'bg-amber-955/35 border-amber-500/20 text-amber-450'
                  }`}
                  title="Switch between Cell Mast and Satellite Hop Simulation"
                >
                  <span className={`w-1 h-1 rounded-full ${simNetworkMode === 'online' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  {simNetworkMode === 'online' ? 'Cellular Grid' : 'Satellite Hop'}
                </button>
              </div>

              {/* collapsible Directory and Form panel inside the chat stream */}
              {showContactManager && (
                <div className="absolute top-0 inset-x-0 bg-[#060c18] border-b border-zinc-900 z-30 p-3 shadow-xl space-y-3 max-h-[85%] overflow-y-auto custom-scrollbar font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                    <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Responders Directory</span>
                    <button onClick={() => setShowContactManager(false)} className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300">Close [X]</button>
                  </div>

                  {/* Directory list */}
                  <div className="space-y-1.5 font-sans">
                    {smsContacts.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setSelectedContactId(c.id);
                          setShowContactManager(false);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          selectedContactId === c.id 
                            ? 'bg-zinc-900 border-emerald-500/40 text-emerald-400' 
                            : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                        }`}
                      >
                        <div className="truncate min-w-0 flex-1 leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-zinc-200 truncate block">{c.name}</span>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] font-bold px-1 py-0.2 rounded font-mono uppercase tracking-tight shrink-0">{c.label}</span>
                          </div>
                          <span className="text-[8.5px] text-zinc-500 font-mono mt-0.5 block">{c.countryCode} {c.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(c.id, c.name);
                          }}
                          className="p-1 hover:text-red-400 cursor-pointer text-zinc-650 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add contact fast form */}
                  <form onSubmit={handleAddCustomContact} className="p-2.5 bg-zinc-950 border border-zinc-900/80 rounded-lg space-y-2">
                    <span className="block text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Add Quick Receiver Link</span>
                    <input 
                      type="text"
                      placeholder="Pseudonym / Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                      required
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      <select 
                        value={contactCC} 
                        onChange={(e) => setContactCC(e.target.value)}
                        className="bg-zinc-900/60 border border-zinc-850 rounded px-1 text-xs text-zinc-400 focus:outline-none"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+380">+380 (UA)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                      <input 
                        type="tel"
                        placeholder="Mobile line"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="col-span-2 bg-zinc-900/60 border border-zinc-850 rounded px-2 py-1 text-xs text-white focus:outline-none font-sans"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] py-1 rounded font-bold cursor-pointer transition-colors">
                      ADD TO SECURE DIRECTORY
                    </button>
                  </form>
                </div>
              )}

              {/* Scrollable Virtual Thread content context */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar min-h-0 flex flex-col justify-end">
                {(() => {
                  const threadMessages = simThreads[selectedContactId] || [];
                  if (threadMessages.length === 0) {
                    return (
                      <div className="my-auto text-center p-4 space-y-2 text-zinc-600">
                        <MessageSquare className="w-7 h-7 mx-auto text-zinc-850 stroke-1 animate-pulse" />
                        <span className="block text-[10px] font-bold text-zinc-500 font-mono">No Despatches Logged</span>
                        <p className="text-[9px] text-zinc-600 leading-normal max-w-xs mx-auto font-sans">This channel is cleared. Compile standard data packet text and fire outbound signals below.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3.5">
                      {threadMessages.map((msg, idx) => {
                        const isMe = msg.sender === 'me';
                        return (
                          <div key={msg.id || idx} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                            <div className={`p-2.5 rounded-2xl text-[10px] leading-normal break-words border font-sans shadow-sm ${
                              isMe 
                                ? 'bg-zinc-900/90 border-zinc-805 text-zinc-150 rounded-br-none font-medium'
                                : 'bg-zinc-950 border-zinc-900/60 text-zinc-400 rounded-bl-none'
                            }`}>
                              {msg.text}
                            </div>
                            <div className="flex items-center gap-1 mt-1 font-mono text-[8px] text-zinc-650 select-none font-bold">
                              <span>{msg.timestamp}</span>
                              <span>•</span>
                              <span className="capitalize">{msg.networkMode}</span>
                              {isMe && (
                                <>
                                  <span>•</span>
                                  <span className={msg.status === 'delivered' ? 'text-emerald-555 font-bold' : 'text-amber-500 animate-pulse'}>
                                    {msg.status === 'delivered' ? 'delivered' : 'sending'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* simulated bottom overlay console logs */}
                {dispatchStatus !== 'idle' && (
                  <div className="mt-2 border border-zinc-900 rounded-xl p-2 bg-black/95 text-zinc-600 space-y-1 max-h-16 shrink-0 font-mono text-[8px] leading-tight select-none">
                    <span className="block font-bold text-red-500 uppercase tracking-widest text-[7px]">transceiver hopping link</span>
                    <div className="overflow-y-auto max-h-10 space-y-0.5 custom-scrollbar">
                      {simulatedLog.slice(-3).map((log, lidx) => (
                        <div key={lidx} className="truncate">{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preset buttons slider */}
              <div className="p-2 border-t border-zinc-900/40 bg-zinc-950/20 shrink-0 flex gap-1.5 overflow-x-auto custom-scrollbar select-none">
                <button
                  type="button"
                  onClick={() => handleApplyPresetText('🚨 CRITICAL COMPASS: Assistance and paramedic support needed.')}
                  className="px-2 py-0.5 text-[8px] font-bold border border-red-950 bg-red-955/20 text-red-400 rounded-full shrink-0 whitespace-nowrap cursor-pointer hover:bg-red-955/35 transition-colors"
                >
                  🚨 Urgent SOS
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetText('📦 SECURED SUPPLIES: Hydration kits and medicine lists queued.')}
                  className="px-2 py-0.5 text-[8px] font-bold border border-amber-955 bg-amber-955/20 text-amber-450 rounded-full shrink-0 whitespace-nowrap cursor-pointer hover:bg-amber-955/35 transition-colors"
                >
                  📦 Supplies Request
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetText('🏡 SECURED ON-SITE: Power relay backup operating normally.')}
                  className="px-2 py-0.5 text-[8px] font-bold border border-emerald-955 bg-emerald-955/20 text-emerald-450 rounded-full shrink-0 whitespace-nowrap cursor-pointer hover:bg-emerald-955/35 transition-colors"
                >
                  🏡 Check Safe
                </button>
              </div>

              {/* Compose bar input */}
              <div className="p-2.5 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-550 select-none font-bold">
                  {/* twilio real carrier toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-350">
                    <input 
                      type="checkbox"
                      checked={sendViaTwilio}
                      onChange={(e) => {
                        setSendViaTwilio(e.target.checked);
                        setSmsErrorMessage(null);
                        setSmsSuccessMessage(null);
                      }}
                      className="accent-emerald-500 rounded cursor-pointer w-3 h-3"
                    />
                    <span>Live Gateway Router</span>
                  </label>
                  <span>140 byte packet size</span>
                </div>

                {smsErrorMessage && (
                  <p className="text-[8px] text-red-400 leading-tight bg-red-955/20 p-1 border border-red-950 rounded font-mono">
                    {smsErrorMessage.includes('TWILIO_CREDENTIALS_MISSING') ? '⚠️ Set Twilio values in Settings to route actual GSM SMS.' : smsErrorMessage}
                  </p>
                )}
                {smsSuccessMessage && (
                  <p className="text-[8px] text-emerald-400 leading-tight bg-emerald-955/20 p-1 border border-emerald-950 rounded font-mono font-bold">
                    {smsSuccessMessage}
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Type routing content..."
                    className="flex-1 bg-zinc-900/70 border border-zinc-850 rounded-full px-3.5 py-1 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (sendViaTwilio) {
                          handleRealSMSDispatch();
                        } else {
                          handleSimulateInbuiltDispatch(draftMessage);
                          setDraftMessage('');
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (sendViaTwilio) {
                        handleRealSMSDispatch();
                      } else {
                        handleSimulateInbuiltDispatch(draftMessage);
                        setDraftMessage('');
                      }
                    }}
                    disabled={!draftMessage.trim() || smsSendingStatus === 'sending'}
                    className="p-1 w-7.5 h-7.5 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-550 text-white disabled:opacity-40"
                  >
                    <Send className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* STANDARD MESH CHATTING VIEWPORT */
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-zinc-950/40">
              
              {/* Scrollable messages area */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar min-h-0">
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-650 space-y-2">
                    <MessageCircle className="w-8 h-8 stroke-1 stroke-zinc-800 animate-pulse" />
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">Channel Register Guarded</p>
                    <p className="text-[9px] max-w-xs text-zinc-650 leading-normal font-sans">No security packets hopped to this local block yet. Declare telemetry statuses below.</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, sidx) => {
                    const isMe = msg.from === currentUser.id;
                    let priorityStyle = 'border-zinc-900/60 bg-zinc-950/20';
                    if (msg.priority === 'emergency') priorityStyle = 'border-red-955 bg-red-955/25 text-red-200';
                    else if (msg.priority === 'important') priorityStyle = 'border-amber-955 bg-amber-950/20 text-amber-200';

                    return (
                      <div
                        key={msg.id || sidx}
                        id={`chat-msg-${msg.id}`}
                        className={`flex flex-col max-w-[85%] rounded-xl p-2.5 border text-xs gap-1.5 shadow-sm transition-all ${
                          isMe
                            ? 'ml-auto bg-zinc-900/80 border-zinc-800 text-zinc-150 rounded-br-none'
                            : msg.type === 'broadcast'
                              ? 'mx-auto w-[95%] bg-rose-955/10 border-rose-900/20 text-rose-100'
                              : 'bg-zinc-950 border-zinc-900/60 text-zinc-400 rounded-bl-none'
                        } ${priorityStyle}`}
                      >
                        {/* Sender header details */}
                        <div className="flex items-center justify-between gap-1.5 font-mono text-[8px] text-zinc-600 border-b border-zinc-900/60 pb-1 select-none font-bold">
                          <span className={`font-bold ${isMe ? 'text-emerald-500' : 'text-sky-500'}`}>
                            {isMe ? 'Self (You)' : msg.fromName}
                          </span>
                          <div className="flex items-center gap-1 font-semibold">
                            <span>Hops: {msg.hopCount}</span>
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                          </div>
                        </div>

                        {/* Text body */}
                        <div className="leading-relaxed whitespace-pre-wrap font-sans text-[10px]">
                          {msg.type === 'voice' ? (
                            <div className="flex items-center gap-2 py-1 px-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <button
                                id={`play-voice-btn-${msg.id}`}
                                onClick={() => playSimulatedVoice(msg.audioDuration || 4)}
                                className="w-6.5 h-6.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-450 shrink-0 cursor-pointer hover:bg-emerald-500/30"
                              >
                                <Volume2 className="w-3 h-3 animate-pulse" />
                              </button>
                              <div className="truncate flex-1 leading-normal">
                                <span className="block text-[8.5px] font-bold text-zinc-300 truncate">Encrypted Audio Note</span>
                                <span className="block text-[7.5px] font-mono text-zinc-550 font-bold">Waveform: 440hz sine</span>
                              </div>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>

                        {/* Priority tag */}
                        {msg.priority !== 'normal' && (
                          <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-red-500 select-none mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{msg.priority} priority</span>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              {/* Compose Message input footer area */}
              <div id="chat-compose-area" className="p-3 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-2 shrink-0">
                
                {/* Priority switcher line */}
                {activeChannel !== 'all' ? (
                  <div className="flex items-center gap-1.5 text-[8px] select-none text-zinc-650 font-mono font-bold" id="chat-priority-container">
                    <span className="font-bold text-zinc-555">TAG:</span>
                    <button
                      id="priority-normal-btn"
                      onClick={() => setActivePriority('normal')}
                      className={`px-1.5 py-0.2 rounded border transition-colors ${
                        activePriority === 'normal' 
                          ? 'bg-zinc-900 text-zinc-350 border-zinc-800 font-bold' 
                          : 'border-transparent text-zinc-600'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      id="priority-important-btn"
                      onClick={() => setActivePriority('important')}
                      className={`px-1.5 py-0.2 rounded border transition-colors ${
                        activePriority === 'important' 
                          ? 'bg-amber-955/20 border-amber-900 text-amber-450 font-bold' 
                          : 'border-transparent text-zinc-600'
                      }`}
                    >
                      🟡 Alert
                    </button>
                    <button
                      id="priority-emergency-btn"
                      onClick={() => setActivePriority('emergency')}
                      className={`px-1.5 py-0.2 rounded border transition-colors ${
                        activePriority === 'emergency' 
                          ? 'bg-red-955/25 border-red-900 text-red-455 font-bold' 
                          : 'border-transparent text-zinc-600'
                      }`}
                    >
                      🔴 SOS
                    </button>
                  </div>
                ) : (
                  <div className="text-[8px] text-red-400 font-mono flex items-center gap-1.5 p-1 bg-red-955/15 border border-red-955/40 rounded select-none leading-tight font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Broadcasting restricted. Read-only node lock.</span>
                  </div>
                )}

                {/* Main typing container lines */}
                <div className="flex gap-2">
                  <input
                    id="chat-message-text-input"
                    type="text"
                    value={newTextMessage}
                    onChange={(e) => setNewTextMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    placeholder={activeChannel === 'all' ? "Write-protected..." : "Type tactical packet..."}
                    disabled={activeChannel === 'all'}
                    className="flex-1 bg-zinc-900 border border-zinc-855 rounded-full px-3.5 py-1 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 disabled:opacity-40 font-sans"
                  />
                  <button
                    id="send-chat-msg-btn"
                    onClick={handleSend}
                    disabled={!newTextMessage.trim() || activeChannel === 'all'}
                    className="p-1 w-7.5 h-7.5 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 bg-emerald-600 hover:bg-emerald-555 text-white disabled:opacity-45"
                  >
                    <Send className="w-3 h-3 text-white" />
                  </button>
                </div>

                {/* Walkie talkie PTT */}
                {activeChannel !== 'all' && (
                  <div className="border-t border-zinc-900 pt-1.5 shrink-0 select-none">
                    <PTTButton onVoiceRecorded={handleVoiceSend} emergencyMode={emergencyMode} />
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
