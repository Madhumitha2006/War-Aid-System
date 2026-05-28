/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  appStore, AppState 
} from './store/appStore';
import { 
  LatLng, UserRole, AppLanguage, Message, MapMarker, AidApplication, RescueTask 
} from './types';

// Component Imports
import BottomNav from './components/BottomNav';
import EmergencyBanner from './components/EmergencyBanner';
import MeshSignal from './components/MeshSignal';

// Module Imports
import MeshChat from './modules/Chat/MeshChat';
import RescueMap from './modules/Map/RescueMap';
import AidDistribution from './modules/Aid/AidDistribution';
import AIAssistant from './modules/AIAssistant/AIAssistant';
import VolunteerHub from './modules/Volunteers/VolunteerHub';

// Icons
import { 
  Radio, ShieldAlert, Wifi, BatteryCharging, 
  Terminal, Languages, HelpCircle, Eye, EyeOff, Sparkles, UserCheck 
} from 'lucide-react';

export default function App() {
  const [storeState, setStoreState] = useState<AppState>(appStore.getState());
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('waraid_onboarded_v1') === 'true';
  });

  // Onboarding Setup States
  const [selectedLang, setSelectedLang] = useState<AppLanguage>('en');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [userName, setUserName] = useState('');
  
  // Terminal drawer collapse state
  const [showTerminal, setShowTerminal] = useState(false);

  // Simulated GPS Coordinates
  const [userLocation, setUserLocation] = useState<LatLng>({ lat: 50.4501, lng: 30.5234 });

  // Battery Status API
  const [batteryLevel, setBatteryLevel] = useState(82);

  // Subscribe to Zustand-like reactive store
  useEffect(() => {
    const unsubscribe = appStore.subscribe((next) => {
      setStoreState({ ...next });
    });
    return unsubscribe;
  }, []);

  // Monitor physical or simulated battery updates
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        const handleLevelChange = () => {
          const lvl = Math.round(battery.level * 100);
          setBatteryLevel(lvl);
          if (lvl <= 20) {
            appStore.setEmergencyMode(true);
            appStore.addLog(`[ALERT]: Battery level dropped below 20% (${lvl}%). Automatically triggered power-saving mode.`);
          }
        };

        battery.addEventListener('levelchange', handleLevelChange);
        return () => {
          battery.removeEventListener('levelchange', handleLevelChange);
        };
      });
    } else {
      // Simulate slow battery drain for hackathon view
      const interval = setInterval(() => {
        setBatteryLevel((prev) => {
          const next = prev > 1 ? prev - 1 : 100;
          if (next === 19) {
            appStore.setEmergencyMode(true);
            appStore.addLog('[ALERT]: Critical battery simulation reached (19%). Switched system threads to idle focus.');
          }
          return next;
        });
      }, 95000);
      return () => clearInterval(interval);
    }
  }, []);

  // Query actual browser GPS or default to Kiev Center for tactical maps
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(coords);
          appStore.updateCurrentUser({ location: coords });
          appStore.addLog(`[GPS]: Hardware geolocation confirmed at: [${coords.lat.toFixed(4)}N, ${coords.lng.toFixed(4)}E]`);
        },
        (error) => {
          console.warn("Geolocation permission skipped or unavailable. Standard Kiev mesh active.", error);
          appStore.addLog("[GPS]: Hardware coordinates locked. Falling back to Kyiv Central blast shelters.");
        }
      );
    }
  }, []);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = userName.trim() || `${selectedRole === 'citizen' ? 'Kateryna' : selectedRole === 'volunteer' ? 'Roman' : 'Sector Command'} Kyiv`;
    
    appStore.setLanguage(selectedLang);
    appStore.changePersona(selectedRole, finalName);
    
    localStorage.setItem('waraid_onboarded_v1', 'true');
    setIsOnboarded(true);
  };

  const handleToggleEmergency = () => {
    appStore.setEmergencyMode(!storeState.emergencyMode);
  };

  const handleSendMessage = (msgPayload: {
    to: string;
    type: 'text' | 'voice' | 'photo' | 'location' | 'broadcast';
    content: string;
    priority: 'emergency' | 'important' | 'normal';
  }) => {
    appStore.addMessage({
      ...msgPayload,
      from: storeState.currentUser.id,
      fromName: storeState.currentUser.name,
      encrypted: true
    });
  };

  const handleAddMarker = (markerData: Omit<MapMarker, 'id' | 'timestamp' | 'verified'>) => {
    appStore.addMarker(markerData);
  };

  const handleVerifyMarker = (id: string) => {
    appStore.verifyMarker(id);
  };

  const handleDeleteMarker = (id: string) => {
    appStore.deleteMarker(id);
  };

  const handleAddAidApplication = (appData: Omit<AidApplication, 'id' | 'requestedAt' | 'updatedAt'>) => {
    appStore.addAidApplication(appData);
  };

  const handleUpdateAidStatus = (id: string, status: AidApplication['status'], amount?: number) => {
    appStore.updateAidStatus(id, status, amount);
  };

  const handleAddTask = (taskData: Omit<RescueTask, 'id' | 'createdAt'>) => {
    appStore.addRescueTask(taskData);
  };

  const handleUpdateTaskStatus = (id: string, status: RescueTask['status'], volunteerId?: string, volunteerName?: string) => {
    appStore.updateTaskStatus(id, status, volunteerId, volunteerName);
  };

  // Helper metrics
  const pendingTasksCount = storeState.rescueTasks.filter(t => t.status === 'open').length;

  return (
    <div 
      className={`min-h-screen text-sans flex flex-col justify-between transition-colors duration-300 ${
        storeState.emergencyMode ? 'emergency-theme bg-black text-zinc-300' : 'bg-[#0A1628] text-slate-100'
      }`}
      id="waraid-main-body-container"
    >
      
      {/* 1. App S.O.S Header */}
      <header 
        id="waraid-tactical-header"
        className={`border-b border-zinc-805/40 px-4 py-3 shrink-0 ${
          storeState.emergencyMode ? 'bg-black border-zinc-900' : 'bg-slate-950/60 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse shrink-0" />
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl tracking-wider text-white">WARAID SYSTEM</h1>
              <p className="text-[9px] font-mono tracking-widest text-[#888780] leading-none uppercase">Mobile Tactical Command</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Onboarding Reset/Triage selector */}
            {isOnboarded && (
              <div className="hidden xs:flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">Persona:</span>
                <select
                  id="header-quick-role-select"
                  value={storeState.currentUser.role}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    appStore.changePersona(role);
                    // Smart routing to context tab
                    if (role === 'volunteer') setActiveTab('volunteers');
                    else if (role === 'government') setActiveTab('aid');
                    else setActiveTab('chat');
                  }}
                  className="bg-zinc-900 border border-zinc-805 text-[10px] font-semibold text-zinc-300 px-2.5 py-1 rounded select-none cursor-pointer focus:outline-none"
                >
                  <option value="citizen">👤 Citizen Mode</option>
                  <option value="volunteer">🪖 Rescue Volunteer</option>
                  <option value="government">🛡️ Command Officer</option>
                </select>
              </div>
            )}

            <button
              id="header-terminal-toggle-btn"
              onClick={() => setShowTerminal(!showTerminal)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded transition-colors"
              title="Toggle decentralized communications log"
            >
              <Terminal className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Battery / Emergency Saving mode top banner bar */}
      <EmergencyBanner 
        emergencyMode={storeState.emergencyMode} 
        batteryLevel={batteryLevel} 
        onToggle={handleToggleEmergency} 
      />

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col justify-between overflow-y-auto">
        {!isOnboarded ? (
          /* ==================== SECURE LOCAL ONBOARDING SCREEN ==================== */
          <div id="onboarding-setup-card" className="flex-1 flex items-center justify-center py-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
              
              <div className="text-center space-y-2">
                <Radio className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
                <h2 className="font-display font-bold text-2xl tracking-wider text-white">WARAID CRIsIs GATEWAY</h2>
                <p className="text-xs text-zinc-400 leading-normal">
                  Decentralized tactical coordination without internet. Secure offline-first bootstrap registration.
                </p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-xs sm:text-sm">
                
                {/* Language Select */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-emerald-400" />
                    1. Choose System Language
                  </label>
                  <select
                    id="onboard-lang-select"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as AppLanguage)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-semibold cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="uk">Ukrainian (Українська)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="ar">Arabic (العربية)</option>
                  </select>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    2. Select Tactical Persona
                  </label>
                  <div className="grid grid-cols-3 gap-2" id="onboard-role-toggle-group">
                    {(['citizen', 'volunteer', 'government'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        id={`onboard-role-btn-${role}`}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`py-2 px-1 rounded-lg border text-xs capitalize font-bold transition-all ${
                          selectedRole === role 
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 font-bold' 
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-450'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-zinc-550 mt-1.5 text-center font-mono">
                    {selectedRole === 'citizen' && '👤 Citizen: Can broadcast emergency SOS and file digital aid.'}
                    {selectedRole === 'volunteer' && '🪖 Volunteer: Resolves evacuation tasks, triages shrapnel cases.'}
                    {selectedRole === 'government' && '🛡️ Command Officer: Authorizes official relief application maps.'}
                  </p>
                </div>

                {/* Handle Input */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    3. Pseudonym / Handle Name
                  </label>
                  <input
                    id="onboard-username-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Kateryna (Basement Shelter B)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-semibold"
                    required
                  />
                </div>

                {/* Geolocation Notice */}
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg text-[10px] text-zinc-500 leading-normal flex items-start gap-2 select-none">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span>WARAID COLD SIGNATURE: All details (Aadhaar or keypairs) exist entirely inside on-device local storage. No data departs the terminal without explicit Bluetooth relaying sweeps.</span>
                  </div>
                </div>

                <button
                  id="submit-onboard-register-btn"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Generate Crytographic Passphrase & Enter
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ==================== BOOTSTRAPPED ACTIVE DASHBOARD ==================== */
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Top Mesh diagnostics status bars */}
            <MeshSignal 
              isOnline={storeState.isOnline}
              onToggleOnline={() => appStore.toggleOnline()}
              activePeers={storeState.activePeers}
              meshSignalStrength={storeState.meshSignalStrength}
              syncQueueCount={storeState.syncQueue.length}
              onTriggerSync={() => appStore.triggerManualSync()}
              emergencyMode={storeState.emergencyMode}
            />

            {/* Render selected active core tab module */}
            <div className="flex-1 min-h-0">
              {activeTab === 'chat' && (
                <MeshChat 
                  messages={storeState.messages}
                  users={storeState.users}
                  currentUser={storeState.currentUser}
                  onSendMessage={handleSendMessage}
                  emergencyMode={storeState.emergencyMode}
                />
              )}

              {activeTab === 'map' && (
                <RescueMap 
                  markers={storeState.markers}
                  currentUserLocation={userLocation}
                  onAddMarker={handleAddMarker}
                  onVerifyMarker={handleVerifyMarker}
                  onDeleteMarker={handleDeleteMarker}
                  currentUser={storeState.currentUser}
                  emergencyMode={storeState.emergencyMode}
                />
              )}

              {activeTab === 'aid' && (
                <AidDistribution 
                  aidApplications={storeState.aidApplications}
                  currentUser={storeState.currentUser}
                  onAddApplication={handleAddAidApplication}
                  onUpdateStatus={handleUpdateAidStatus}
                  emergencyMode={storeState.emergencyMode}
                />
              )}

              {activeTab === 'ai' && (
                <AIAssistant 
                  markers={storeState.markers}
                  isOnline={storeState.isOnline}
                  currentUserLocation={userLocation}
                  language={storeState.language}
                  setLanguage={(lang) => appStore.setLanguage(lang)}
                  emergencyMode={storeState.emergencyMode}
                />
              )}

              {activeTab === 'volunteers' && (
                <VolunteerHub 
                  rescueTasks={storeState.rescueTasks}
                  currentUser={storeState.currentUser}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onAddTask={handleAddTask}
                  emergencyMode={storeState.emergencyMode}
                />
              )}
            </div>

            {/* Expandable decentralized message / sync Log Terminal drawer */}
            {showTerminal && (
              <div 
                id="mesh-decentralized-telemetry-drawer"
                className={`border rounded-lg p-3 shrink-0 ${
                  storeState.emergencyMode ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-950/80 border-slate-900'
                }`}
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-widest">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>Active Decentralized Console Telemetry Logs</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="clear-logs-btn"
                      onClick={() => appStore.resetLogs()}
                      className="text-[9px] font-mono hover:text-zinc-300 text-zinc-650 cursor-pointer"
                    >
                      Clear Logs
                    </button>
                    <button
                      id="close-logs-btn"
                      onClick={() => setShowTerminal(false)}
                      className="text-[9px] font-mono hover:text-zinc-300 text-zinc-650 cursor-pointer"
                    >
                      Collapse Console [X]
                    </button>
                  </div>
                </div>

                <div className="h-24 overflow-y-auto font-mono text-[10px] text-zinc-500 space-y-1 custom-scrollbar">
                  {storeState.logs.map((log, lidx) => (
                    <div key={lidx} className="truncate select-none">{log}</div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* 3. Bottom Tabs bar navigation controller */}
      {isOnboarded && (
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          unreadCount={0} 
          openTasksCount={pendingTasksCount}
          emergencyMode={storeState.emergencyMode}
        />
      )}

    </div>
  );
}
