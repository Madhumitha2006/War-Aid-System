/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageSquare, Map, Package, Bot, Users } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  openTasksCount?: number;
  emergencyMode: boolean;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  unreadCount = 0,
  openTasksCount = 0,
  emergencyMode
}: Props) {
  const navItems = [
    { id: 'chat', label: 'Mesh Chat', icon: MessageSquare, badge: unreadCount },
    { id: 'map', label: 'Rescue Map', icon: Map, badge: 0 },
    { id: 'aid', label: 'Aid Hub', icon: Package, badge: 0 },
    { id: 'ai', label: 'AI Support', icon: Bot, badge: 0 },
    { id: 'volunteers', label: 'Volunteers', icon: Users, badge: openTasksCount }
  ];

  return (
    <nav 
      id="bottom-tab-navigation-bar"
      className={`border-t safe-bottom transition-all duration-300 ${
        emergencyMode 
          ? 'bg-black border-zinc-905 text-zinc-400' 
          : 'bg-slate-900 border-slate-800 text-slate-400 shadow-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              id={`nav-${item.id}-btn`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full relative transition-all ${
                isActive 
                  ? emergencyMode ? 'text-white font-bold' : 'text-emerald-400 font-bold'
                  : 'hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                {item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white font-semibold rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-wider uppercase truncate max-w-full">
                {item.label}
              </span>
              
              {/* Highlight bar under selected */}
              {isActive && (
                <div 
                  className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-t-full ${
                    emergencyMode ? 'bg-white' : 'bg-emerald-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
