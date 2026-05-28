/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Users, Eye, Trash2, Tag, Compass, Layers, 
  UserCheck, AlertCircle, FileText, CheckCircle2, ShieldAlert, CheckCircle 
} from 'lucide-react';
import { RescueTask, User, LatLng } from '../../types';

interface Props {
  rescueTasks: RescueTask[];
  currentUser: User;
  onUpdateTaskStatus: (id: string, status: RescueTask['status'], volunteerId?: string, volunteerName?: string) => void;
  onAddTask: (task: Omit<RescueTask, 'id' | 'createdAt'>) => void;
  emergencyMode: boolean;
}

export default function VolunteerHub({
  rescueTasks,
  currentUser,
  onUpdateTaskStatus,
  onAddTask,
  emergencyMode
}: Props) {
  const [isRegistered, setIsRegistered] = useState(
    currentUser.role === 'volunteer' || !!currentUser.skills
  );
  
  // Registration States
  const [volunteerName, setVolunteerName] = useState(currentUser.name);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'First Aid', 'Supply Delivery'
  ]);

  // Coordinator state for Task Creation
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<RescueTask['type']>('medical');
  const [taskUrgency, setTaskUrgency] = useState<RescueTask['urgency']>('high');
  const [taskLat, setTaskLat] = useState(currentUser.location?.lat || 50.4501);
  const [taskLng, setTaskLng] = useState(currentUser.location?.lng || 30.5234);
  const [taskDesc, setTaskDesc] = useState('');

  // Supply signed status
  const [signOffIndex, setSignOffIndex] = useState<string | null>(null);

  const skillsOptions = [
    'First Aid',
    'Tactical Medicine',
    'Heavy Extraction & Search',
    'Structure Mapping',
    'Logistics Delivery',
    'Language Translation'
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
    // Persist volunteer role in app state
    currentUser.role = 'volunteer';
    currentUser.name = volunteerName;
    currentUser.skills = selectedSkills;
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask({
      type: taskType,
      title: taskTitle,
      description: taskDesc,
      urgency: taskUrgency,
      location: { lat: Number(taskLat), lng: Number(taskLng) },
      status: 'open',
      createdBy: currentUser.name
    });

    // Reset task form
    setTaskTitle('');
    setTaskDesc('');
    setShowTaskForm(false);
  };

  const handleSkillCheck = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Filter tasks: Volunteers see theirs + available, Gov sees all
  const visibleTasks = rescueTasks.filter(t => {
    if (currentUser.role === 'government') return true;
    return t.status === 'open' || t.assignedTo === currentUser.id;
  });

  return (
    <div id="volunteer-hub-container" className="space-y-4 my-4 text-xs sm:text-sm">
      
      {/* Title Controls Header */}
      <div id="volunteer-header-controls" className="flex flex-wrap items-center justify-between border-b border-zinc-850 pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">Module 5 — Tactical Rescue Volunteer Coordination</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Register nearby specialists, schedule extraction workorders, or track logistics loops.</p>
        </div>

        {currentUser.role === 'government' && (
          <button
            id="open-create-task-modal-btn"
            onClick={() => setShowTaskForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Mission</span>
          </button>
        )}
      </div>

      {!isRegistered && currentUser.role !== 'government' ? (
        /* ==================== VOLUNTEER REGISTRATION SHEET ==================== */
        <div id="volunteer-registration-panel" className="border border-zinc-800 rounded-xl p-5 bg-slate-950/25 max-w-md mx-auto space-y-4 shadow-lg">
          <div className="text-center space-y-2">
            <Users className="w-10 h-10 text-emerald-500 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Register as a Field Rescue Volunteer</h4>
            <p className="text-xs text-zinc-500 leading-normal">
              Registering broadcasts your encryption keys and skills to surrounding civil defense coordinates, allowing automatic mission alignment offline.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Volunteers Tactical Pseudonym / Handle</label>
              <input
                id="volunteer-reg-name-field"
                type="text"
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="e.g. Roman - Sector B Combat Medic..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Check Tactical Capabilities</label>
              <div className="grid grid-cols-2 gap-2">
                {skillsOptions.map(skill => {
                  const hasSkill = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      id={`skill-toggle-btn-${skill.replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => handleSkillCheck(skill)}
                      className={`text-left p-2 rounded border transition-all truncate ${
                        hasSkill ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 font-semibold' : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {hasSkill ? '✓ ' : '+ '} {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="submit-volunteer-reg-btn"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors cursor-pointer"
            >
              Confirm and Register Keys offline
            </button>
          </form>
        </div>
      ) : (
        /* ==================== ACTIVE TASKS LIST VIEW ==================== */
        <div id="volunteer-missions-panel" className="space-y-3">
          
          {visibleTasks.length === 0 ? (
            <div className="text-center p-8 border border-zinc-850 rounded-xl bg-slate-950/15 text-zinc-500">
              No active rescue mission assignments on your coordinate log currently.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="volunteer-tasks-grid">
              {visibleTasks.map(task => {
                const isAssignedToMe = task.assignedTo === currentUser.id;
                
                // Urgency style modifiers
                let alertColor = 'border-zinc-800 text-zinc-300 bg-zinc-950/20';
                if (task.urgency === 'critical') alertColor = 'border-red-950 bg-red-950/10 text-rose-200';
                else if (task.urgency === 'high') alertColor = 'border-amber-950 bg-amber-950/5 text-amber-200';

                return (
                  <div key={task.id} className={`border rounded-lg p-3.5 space-y-3 ${alertColor}`} id={`volunteer-task-card-${task.id}`}>
                    <div className="flex items-center justify-between flex-wrap gap-1 border-b border-zinc-900 pb-1.5">
                      <div>
                        <div className="font-bold text-zinc-100">{task.title}</div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-1">Dispatched: {task.id}</div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {task.type}
                        </span>

                        <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded ${
                          task.status === 'open' ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20' :
                          task.status === 'complete' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-normal">{task.description}</p>

                    <div className="text-[10px] space-y-1 pt-1 font-mono text-zinc-500">
                      <div>**GPS grid**: {task.location.lat.toFixed(4)}N, {task.location.lng.toFixed(4)}E</div>
                      <div>**Authorizer**: {task.createdBy}</div>
                      {task.assignedToName && (
                        <div className="text-emerald-400 font-semibold">
                          **Assigned Agent**: {task.assignedToName}
                        </div>
                      )}
                    </div>

                    {/* Action toggles panel for Volunteer Status Shift */}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-900 pt-2 flex-wrap text-xs">
                      {task.status === 'open' && currentUser.role === 'volunteer' && (
                        <button
                          id={`accept-mission-btn-${task.id}`}
                          onClick={() => onUpdateTaskStatus(task.id, 'assigned', currentUser.id, currentUser.name)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer leading-none text-xs"
                        >
                          Accept Mission
                        </button>
                      )}

                      {isAssignedToMe && task.status === 'assigned' && (
                        <button
                          id={`enroute-mission-btn-${task.id}`}
                          onClick={() => onUpdateTaskStatus(task.id, 'en_route')}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer leading-none text-xs"
                        >
                          Start Journey: En Route
                        </button>
                      )}

                      {isAssignedToMe && task.status === 'en_route' && (
                        <button
                          id={`onscene-mission-btn-${task.id}`}
                          onClick={() => onUpdateTaskStatus(task.id, 'on_scene')}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer leading-none text-xs"
                        >
                          Arrived: On Scene
                        </button>
                      )}

                      {isAssignedToMe && task.status === 'on_scene' && (
                        <button
                          id={`verify-qr-signoff-btn-${task.id}`}
                          onClick={() => setSignOffIndex(task.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer leading-none text-xs"
                        >
                          Scanned P2P QR Sign-off
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* QR Code Sign-off modal overlay simulation */}
      {signOffIndex && (
        <div id="volunteer-signoff-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Scanned QR Sign-off Verified</h4>
            <p className="text-xs text-zinc-500 leading-normal">
              Recipient has presented digital Aadhaar key signature. Supply delivery is officially completed offline. Resilient state ledger updated.
            </p>

            <button
              id="confirm-signoff-btn"
              onClick={() => {
                onUpdateTaskStatus(signOffIndex, 'complete');
                setSignOffIndex(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors cursor-pointer"
            >
              Sign and Complete Mission
            </button>
          </div>
        </div>
      )}

      {/* Mission Creation modal dialog overlay for Coordinator */}
      {showTaskForm && (
        <div id="volunteer-schedule-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Schedule Rescue Dispatch</h4>
              <button
                id="close-task-modal-btn"
                onClick={() => setShowTaskForm(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold font-mono"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Mission Action Title</label>
                <input
                  id="task-create-title-field"
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Flood Extraction Sector 5..."
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Task Category</label>
                  <select
                    id="task-create-category-select"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as RescueTask['type'])}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300"
                  >
                    <option value="medical">Medical Assistance</option>
                    <option value="evacuation">Evacuation Escort</option>
                    <option value="supply">Supply Delivery</option>
                    <option value="search">Missing Search</option>
                    <option value="report">Damage Assessor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Threat Priority</label>
                  <select
                    id="task-create-urgency-select"
                    value={taskUrgency}
                    onChange={(e) => setTaskUrgency(e.target.value as RescueTask['urgency'])}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300"
                  >
                    <option value="critical">🔴 Critical Action</option>
                    <option value="high">🟡 High Threat</option>
                    <option value="medium">⚪ Normal Case</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Target GPS grid Coordinates</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="task-create-lat-field"
                    type="number"
                    step="0.0001"
                    value={taskLat}
                    onChange={(e) => setTaskLat(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono"
                    required
                  />
                  <input
                    id="task-create-lng-field"
                    type="number"
                    step="0.0001"
                    value={taskLng}
                    onChange={(e) => setTaskLng(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Operational Instructions / Intel</label>
                <textarea
                  id="task-create-desc-field"
                  rows={2.5}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Details, patient age constraints, specific routes safety recommendations..."
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  id="cancel-create-task-btn"
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 px-3 py-1.5 rounded font-bold hover:text-zinc-200 cursor-pointer text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-task-btn"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded cursor-pointer animate-pulse"
                >
                  Confirm dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
