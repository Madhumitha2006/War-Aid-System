/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Message, MapMarker, AidApplication, RescueTask, AppLanguage, UserRole, AidStatus } from '../types';

// Mock initial data to give a highly active, realistic scenario upon opening the app
const PRE_SEEDED_USERS: User[] = [
  {
    id: 'gov-hq',
    name: 'State Civil Defense HQ',
    role: 'government',
    publicKey: 'key-gov-hq',
    lastSeen: Date.now(),
    location: { lat: 50.4501, lng: 30.5234 }
  },
  {
    id: 'vol-dmytro',
    name: 'Dmytro (Medic & Logistics)',
    role: 'volunteer',
    skills: ['First Aid', 'Supply Delivery', 'Evacuation Escort'],
    publicKey: 'key-vol-dmytro',
    lastSeen: Date.now() - 45000,
    location: { lat: 50.4552, lng: 30.5112 }
  },
  {
    id: 'vol-maria',
    name: 'Dr. Maria (Field Surgeon)',
    role: 'volunteer',
    skills: ['First Aid', 'Surgical Triage'],
    publicKey: 'key-vol-maria',
    lastSeen: Date.now() - 12000,
    location: { lat: 50.4423, lng: 30.5401 }
  },
  {
    id: 'citizen-olena',
    name: 'Olena Zelenska',
    role: 'citizen',
    publicKey: 'key-citizen-olena',
    lastSeen: Date.now() - 300000,
    location: { lat: 50.4485, lng: 30.5280 }
  }
];

const PRE_SEEDED_MESSAGES: Message[] = [
  {
    id: 'msg-init-1',
    from: 'gov-hq',
    fromName: 'Civil Defense HQ',
    to: 'all',
    type: 'broadcast',
    content: '🚨 ALERT: Curfew starts tonight at 20:00. Points of Invincibility at Central Station and School #14 are fully stocked with water, thermal blankets, and high-capacity satellite chargers. Proceed with extreme caution.',
    timestamp: Date.now() - 3600000,
    priority: 'emergency',
    hopCount: 1,
    encrypted: false,
    delivered: true
  },
  {
    id: 'msg-init-2',
    from: 'citizen-olena',
    fromName: 'Olena Zelenska',
    to: 'vol-dmytro',
    type: 'text',
    content: 'Can you deliver infant baby formula to the basement of the Podil cultural hall? We have 4 families sheltering there from the afternoon shelling.',
    timestamp: Date.now() - 1800000,
    priority: 'important',
    hopCount: 3,
    encrypted: true,
    delivered: true
  },
  {
    id: 'msg-init-3',
    from: 'vol-dmytro',
    fromName: 'Dmytro (Medic)',
    to: 'citizen-olena',
    type: 'text',
    content: 'Understood. Loading supply truck with food kits, medical supplies, and 6 liters of pasteurized baby formula. Deploying now. Signal strength looks stable.',
    timestamp: Date.now() - 1500000,
    priority: 'normal',
    hopCount: 2,
    encrypted: true,
    delivered: true
  },
  {
    id: 'msg-init-4',
    from: 'gov-hq',
    fromName: 'Civil Defense HQ',
    to: 'all',
    type: 'broadcast',
    content: '📢 SAFE ZONE CORRIDOR: Green humanitarian corridor opened from Chernihiv toward Kyiv from 10:00 to 14:00 tomorrow. Escorted by rescue convoys.',
    timestamp: Date.now() - 600000,
    priority: 'emergency',
    hopCount: 1,
    encrypted: false,
    delivered: true
  }
];

const PRE_SEEDED_MARKERS: MapMarker[] = [
  {
    id: 'mark-shelter-1',
    type: 'shelter',
    location: { lat: 50.4536, lng: 30.5164 },
    title: 'Metro Station Golden Gate Deep Shelter',
    description: 'Double steel blast doors, medical bay, drinking water reserve (5000L). Capacity for 1,200 citizens.',
    reportedBy: 'State Civil Defense',
    verified: true,
    timestamp: Date.now() - 86400000
  },
  {
    id: 'mark-invincibility-1',
    type: 'invincibility',
    location: { lat: 50.4445, lng: 30.5054 },
    title: 'Point of Invincibility - School #14',
    description: 'Equipped with heating stoves, generator power pods, starlink backup, soup kitchen, and pediatric cot station.',
    reportedBy: 'Kyiv Volunteer Coalition',
    verified: true,
    timestamp: Date.now() - 50000000
  },
  {
    id: 'mark-hospital-1',
    type: 'hospital',
    location: { lat: 50.4578, lng: 30.5298 },
    title: 'Kyiv Emergency Clinical Hospital #12',
    description: 'Surgery team in subterranean trauma unit. Armed with backup fuel cells. Drop point for blood supply.',
    reportedBy: 'Health Dept',
    verified: true,
    timestamp: Date.now() - 200000000
  },
  {
    id: 'mark-danger-1',
    type: 'danger',
    location: { lat: 50.4650, lng: 30.5011 },
    title: '⚠️ Unexploded Ordnance reported',
    description: 'Artillery shell embedded in the roadway. Road is hazardous. Demining team notified.',
    reportedBy: 'Vol-Maria',
    verified: true,
    timestamp: Date.now() - 400000
  },
  {
    id: 'mark-missing-1',
    type: 'missing_person',
    location: { lat: 50.4490, lng: 30.5350 },
    title: 'Mykhailo Kovalenko (64yo)',
    description: 'Last seen near Mariinskyi Park in grey wool coat. Walking with cane. Family searching, channel #4.',
    reportedBy: 'Olena Zelenska',
    verified: false,
    timestamp: Date.now() - 72000
  }
];

const PRE_SEEDED_TASKS: RescueTask[] = [
  {
    id: 'task-1',
    type: 'evacuation',
    location: { lat: 50.4510, lng: 30.4990 },
    urgency: 'critical',
    assignedTo: 'vol-dmytro',
    assignedToName: 'Dmytro (Medic & Logistics)',
    status: 'assigned',
    createdBy: 'gov-hq',
    createdAt: Date.now() - 1200000,
    title: 'Escort Elder Citizen with Mobility Aid',
    description: 'Hanna Ivanov, age 82, resides on 8th floor of structural-damaged building. Elevator is inactive. Needs physical extraction to safe zone transport.'
  },
  {
    id: 'task-2',
    type: 'medical',
    location: { lat: 50.4423, lng: 30.5401 },
    urgency: 'high',
    assignedTo: 'vol-maria',
    assignedToName: 'Dr. Maria (Field Surgeon)',
    status: 'on_scene',
    createdBy: 'citizen-olena',
    createdAt: Date.now() - 3600000,
    title: 'Subterranean Triage in Metro St. Svyatoshyn',
    description: 'Surgical patching of lower extremities and shrapnel cleanup for 3 emergency shell casualties.'
  },
  {
    id: 'task-3',
    type: 'search',
    location: { lat: 50.4380, lng: 30.5220 },
    urgency: 'medium',
    status: 'open',
    createdBy: 'gov-hq',
    createdAt: Date.now() - 600000,
    title: 'Missing Persons Search - Hospital #3 Subspace',
    description: 'Map basement levels and reconcile emergency logs against national ID rosters to find missing children.'
  }
];

const PRE_SEEDED_AID: AidApplication[] = [
  {
    id: 'aid-1',
    applicant: 'citizen-olena',
    applicantName: 'Olena Zelenska',
    type: 'food',
    status: 'dispatched',
    requestedAt: Date.now() - 4800000,
    updatedAt: Date.now() - 1800000,
    description: 'Family relief pack + infant dairy kit for safehouse.'
  }
];

// Definition of application state
export interface AppState {
  currentUser: User;
  users: User[];
  messages: Message[];
  markers: MapMarker[];
  aidApplications: AidApplication[];
  rescueTasks: RescueTask[];
  emergencyMode: boolean;
  language: AppLanguage;
  isOnline: boolean;
  syncQueue: string[]; // Mock changes queued for official sync when net is restored
  meshSignalStrength: number; // Percentage 0 - 100
  activePeers: number; // Connected nodes in short bluetooth radius
  logs: string[]; // Sim telemetry
}

// Basic state store in Vanilla TS with subscribers to trigger React re-renders easily
type Listener = (state: AppState) => void;
class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    const saved = localStorage.getItem('waraid_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure defaults if keys missing
        return {
          currentUser: parsed.currentUser || this.getDefaultUser(),
          users: parsed.users || PRE_SEEDED_USERS,
          messages: parsed.messages || PRE_SEEDED_MESSAGES,
          markers: parsed.markers || PRE_SEEDED_MARKERS,
          aidApplications: parsed.aidApplications || PRE_SEEDED_AID,
          rescueTasks: parsed.rescueTasks || PRE_SEEDED_TASKS,
          emergencyMode: parsed.emergencyMode ?? false,
          language: parsed.language || 'en',
          isOnline: parsed.isOnline ?? false,
          syncQueue: parsed.syncQueue || [],
          meshSignalStrength: parsed.meshSignalStrength ?? 92,
          activePeers: parsed.activePeers ?? 4,
          logs: parsed.logs || ['[SYS]: System initialized offline bootstrap.', '[MESH]: Discovery scan complete. 4 nodes active.']
        };
      } catch (e) {
        console.error('Error loading state from localStorage:', e);
      }
    }
    return this.getDefaultState();
  }

  private getDefaultUser(): User {
    return {
      id: 'citizen-olena',
      name: 'Olena Zelenska',
      role: 'citizen',
      publicKey: 'key-citizen-olena',
      lastSeen: Date.now(),
      location: { lat: 50.4485, lng: 30.5280 }
    };
  }

  private getDefaultState(): AppState {
    return {
      currentUser: this.getDefaultUser(),
      users: PRE_SEEDED_USERS,
      messages: PRE_SEEDED_MESSAGES,
      markers: PRE_SEEDED_MARKERS,
      aidApplications: PRE_SEEDED_AID,
      rescueTasks: PRE_SEEDED_TASKS,
      emergencyMode: false,
      language: 'en',
      isOnline: false,
      syncQueue: [],
      meshSignalStrength: 92,
      activePeers: 4,
      logs: [
        '[SYS]: Cold storage online.',
        '[NODE]: Passphrase seed generated locally.',
        '[MESH]: Bluetooth LE discoverability registered as Relay Point #50',
        '[SYS]: SQLite index compiled.'
      ]
    };
  }

  public save() {
    localStorage.setItem('waraid_state_v1', JSON.stringify(this.state));
    this.listeners.forEach((func) => func(this.state));
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(func: Listener) {
    this.listeners.add(func);
    return () => {
      this.listeners.delete(func);
    };
  }

  // --- ACTIONS ---

  public updateCurrentUser(user: Partial<User>) {
    this.state.currentUser = { ...this.state.currentUser, ...user };
    this.addLog(`[USER]: Personal profile key modified: ${user.name || this.state.currentUser.name}`);
    this.save();
  }

  public changePersona(role: UserRole, name?: string) {
    let skills: string[] | undefined = undefined;
    if (role === 'volunteer') {
      skills = ['First Aid', 'Supply Delivery', 'Search and Rescue'];
    }

    const matchedUser = this.state.users.find(u => u.role === role);
    const resolvedName = name || (matchedUser ? matchedUser.name : `${role === 'citizen' ? 'Kateryna' : role === 'volunteer' ? 'Roman' : 'Command Centre'} Kyiv`);

    this.state.currentUser = {
      id: matchedUser ? matchedUser.id : `${role}-${Math.random().toString(36).substr(2, 5)}`,
      name: resolvedName,
      role,
      skills,
      publicKey: `key-${role}-${Date.now()}`,
      lastSeen: Date.now(),
      location: this.state.currentUser.location || { lat: 50.4485, lng: 30.5280 }
    };

    // If citizen/volunteer details change, let's register/update in nearby node list
    if (!this.state.users.some(u => u.id === this.state.currentUser.id)) {
      this.state.users.push(this.state.currentUser);
    }

    this.addLog(`[ROLE]: Switched persona to [${role.toUpperCase()}] - ${resolvedName}`);
    this.save();
  }

  public setLanguage(lang: AppLanguage) {
    this.state.language = lang;
    this.addLog(`[SYS]: Core dictionary swapped to: ${lang.toUpperCase()}`);
    this.save();
  }

  public setEmergencyMode(enable: boolean) {
    this.state.emergencyMode = enable;
    if (enable) {
      this.state.meshSignalStrength = 98; // prioritize signal
      this.state.activePeers = Math.max(1, this.state.activePeers - 1); // reduce polling
      this.addLog('[⚡ EM]: OLED black activated. Anim disabled. CPU throttled to saving mode.');
    } else {
      this.addLog('[SYS]: Emergency state terminated. Full render thread active.');
    }
    this.save();
  }

  public toggleOnline() {
    const nextStatus = !this.state.isOnline;
    this.state.isOnline = nextStatus;
    if (nextStatus) {
      this.addLog('[SYS]: Backhaul active. Synced local IndexedDB with government state master.');
      // Empty sync queue with simulated synchronicity
      this.state.syncQueue = [];
    } else {
      this.addLog('[SYS]: Connection broken. Switching back to secure decentralized bluetooth mesh.');
    }
    this.save();
  }

  public addMessage(msg: Omit<Message, 'id' | 'timestamp' | 'hopCount' | 'delivered'>) {
    const isEmergency = this.state.emergencyMode;
    const newMsg: Message = {
      ...msg,
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      hopCount: msg.type === 'broadcast' ? 1 : Math.floor(Math.random() * 3) + 1,
      delivered: true
    };
    this.state.messages.push(newMsg);

    if (!this.state.isOnline) {
      this.state.syncQueue.push(`msg-${newMsg.id}`);
    }

    this.addLog(`[MSG]: Created locally, relayed as hop=${newMsg.hopCount}. Priority: ${msg.priority}`);
    this.save();
    return newMsg;
  }

  public addMarker(marker: Omit<MapMarker, 'id' | 'timestamp' | 'verified'>) {
    const newMarker: MapMarker = {
      ...marker,
      id: `mark-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      verified: marker.reportedBy === 'government' || marker.reportedBy === 'State Civil Defense'
    };
    this.state.markers.unshift(newMarker);
    
    if (!this.state.isOnline) {
      this.state.syncQueue.push(`mark-${newMarker.id}`);
    }

    this.addLog(`[MAP]: Added pin [${marker.type.toUpperCase()}] reported by ${marker.reportedBy}`);
    this.save();
    return newMarker;
  }

  public verifyMarker(id: string) {
    const item = this.state.markers.find(m => m.id === id);
    if (item) {
      item.verified = true;
      this.addLog(`[MAP]: Official validation signed for marker: ${item.title}`);
      this.save();
    }
  }

  public deleteMarker(id: string) {
    this.state.markers = this.state.markers.filter(m => m.id !== id);
    this.addLog(`[MAP]: Deleted marker: ${id}`);
    this.save();
  }

  public addAidApplication(app: Omit<AidApplication, 'id' | 'requestedAt' | 'updatedAt'>) {
    const newApp: AidApplication = {
      ...app,
      id: `aid-${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: Date.now(),
      updatedAt: Date.now()
    };
    this.state.aidApplications.unshift(newApp);

    if (!this.state.isOnline) {
      this.state.syncQueue.push(`aid-${newApp.id}`);
    }

    this.addLog(`[RELIEF]: Filed digital request for ${app.type.toUpperCase()} assistance.`);
    this.save();
    return newApp;
  }

  public updateAidStatus(id: string, status: AidStatus, amount?: number) {
    const app = this.state.aidApplications.find(a => a.id === id);
    if (app) {
      app.status = status;
      app.updatedAt = Date.now();
      if (amount !== undefined) app.amount = amount;
      this.addLog(`[RELIEF]: Aid ${id} status updated to: ${status.toUpperCase()}`);
      this.save();
    }
  }

  public addRescueTask(task: Omit<RescueTask, 'id' | 'createdAt'>) {
    const newTask: RescueTask = {
      ...task,
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    this.state.rescueTasks.unshift(newTask);

    if (!this.state.isOnline) {
      this.state.syncQueue.push(`task-${newTask.id}`);
    }

    this.addLog(`[TASK]: Opened rescue operations dispatch: [${task.type.toUpperCase()}]`);
    this.save();
    return newTask;
  }

  public updateTaskStatus(id: string, status: RescueTask['status'], volunteerId?: string, volunteerName?: string) {
    const task = this.state.rescueTasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      if (volunteerId !== undefined) {
        task.assignedTo = volunteerId;
        task.assignedToName = volunteerName;
      }
      this.addLog(`[TASK]: WorkOrder ${id} shifted state to [${status.toUpperCase()}]`);
      this.save();
    }
  }

  public triggerManualSync() {
    if (this.state.syncQueue.length === 0) {
      this.addLog('[SYNC]: No local mutations pending. Safe-state confirmed.');
      return;
    }
    
    const count = this.state.syncQueue.length;
    this.state.syncQueue = [];
    this.addLog(`[SYNC]: Successfully pushed ${count} discrete payloads to government server master.`);
    this.save();
  }

  public addLog(log: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.state.logs.unshift(`[${timestamp}] ${log}`);
    // Cap at 100 entries for stability
    if (this.state.logs.length > 100) {
      this.state.logs.pop();
    }
  }

  public resetLogs() {
    this.state.logs = [
      `[${new Date().toLocaleTimeString()}] [SYS]: Terminal telemetry flushed.`
    ];
    this.save();
  }
}

export const appStore = new Store();
