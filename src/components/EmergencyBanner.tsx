/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Zap, BatteryCharging, Power } from 'lucide-react';
import { appStore } from '../store/appStore';

interface Props {
  emergencyMode: boolean;
  batteryLevel: number;
  onToggle: () => void;
}

export default function EmergencyBanner({ emergencyMode, batteryLevel, onToggle }: Props) {
  return (
    <div 
      id="emergency-banner-box"
      className={`border-b transition-all duration-300 ${
        emergencyMode 
          ? 'bg-black border-red-950 text-red-500 py-2 px-4' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 py-1.5 px-3'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wider">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {emergencyMode ? (
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          ) : (
            <Zap className="w-4 h-4 text-amber-500" />
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span>
              {emergencyMode 
                ? "⚡ ULTRA EMERGENCY SAVING PATTERN ACTIVE" 
                : "⚡ POWER CONSERVATION RECOMMENDED"
              }
            </span>
            <span className="opacity-75 font-normal text-xs">
              ({emergencyMode 
                ? "Animations paused • Map throttled • OLED Black forced" 
                : "Tap Toggle to double battery life in grids"
              })
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <BatteryCharging className={`w-4 h-4 ${batteryLevel < 20 ? 'text-red-500 animate-bounce' : 'text-emerald-500'}`} />
            <span className="font-mono text-xs">{batteryLevel}%</span>
          </div>

          <button
            id="toggle-emergency-btn"
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors font-semibold ${
              emergencyMode 
                ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800' 
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{emergencyMode ? "Disable Emergency" : "Enable Emergency"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
