/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw, Layers, Database } from 'lucide-react';

interface Props {
  isOnline: boolean;
  onToggleOnline: () => void;
  activePeers: number;
  meshSignalStrength: number;
  syncQueueCount: number;
  onTriggerSync: () => void;
  emergencyMode: boolean;
}

export default function MeshSignal({
  isOnline,
  onToggleOnline,
  activePeers,
  meshSignalStrength,
  syncQueueCount,
  onTriggerSync,
  emergencyMode
}: Props) {
  return (
    <div 
      id="mesh-signal-header-block"
      className={`border rounded-lg p-3 ${
        emergencyMode 
          ? 'bg-black border-zinc-800 text-zinc-300' 
          : 'bg-slate-900 border-slate-800 text-slate-100 shadow-lg'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 gap-y-2">
        {/* Core signal metrics */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className={`flex h-2.5 w-2.5 rounded-full ${
                activePeers > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Mesh Network Topology</div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                <span>{activePeers} Peer Nodes Active</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400">{meshSignalStrength}% Link</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
            <Database className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Buffer Queue</div>
              <div className="font-mono text-sm font-semibold text-sky-400">
                {syncQueueCount} payloads unsynced
              </div>
            </div>
          </div>
        </div>

        {/* Backhaul Sync / Force Online switch panel */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {syncQueueCount > 0 && (
            <button
              id="trigger-sync-btn"
              onClick={onTriggerSync}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                emergencyMode 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Sync Now</span>
            </button>
          )}

          <button
            id="toggle-online-network-btn"
            onClick={onToggleOnline}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-all font-semibold ${
              isOnline 
                ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-500' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
            }`}
            title="Toggle between real/fallback server cloud syncing and peer-only bluetooth mesh."
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online (Satellite Link)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline MESH Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
