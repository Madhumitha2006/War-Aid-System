/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MedAgent } from './MedAgent';
import { SurvivalAgent } from './SurvivalAgent';
import { ResourceAgent } from './ResourceAgent';
import { DisasterAgent } from './DisasterAgent';
import { MapMarker, LatLng } from '../types';

export interface AgentDetails {
  name: string;
  alias: string;
  description: string;
  icon: string;
}

export const AGENT_LIST: AgentDetails[] = [
  {
    name: MedAgent.name,
    alias: MedAgent.alias,
    description: MedAgent.description,
    icon: MedAgent.icon
  },
  {
    name: SurvivalAgent.name,
    alias: SurvivalAgent.alias,
    description: SurvivalAgent.description,
    icon: SurvivalAgent.icon
  },
  {
    name: ResourceAgent.name,
    alias: ResourceAgent.alias,
    description: ResourceAgent.description,
    icon: ResourceAgent.icon
  },
  {
    name: DisasterAgent.name,
    alias: DisasterAgent.alias,
    description: DisasterAgent.description,
    icon: DisasterAgent.icon
  }
];

export const AgentRouter = {
  // Finds the best specialized sub-agent for the query
  route(query: string): AgentDetails {
    if (MedAgent.match(query)) {
      return { name: MedAgent.name, alias: MedAgent.alias, description: MedAgent.description, icon: MedAgent.icon };
    }
    if (SurvivalAgent.match(query)) {
      return { name: SurvivalAgent.name, alias: SurvivalAgent.alias, description: SurvivalAgent.description, icon: SurvivalAgent.icon };
    }
    if (ResourceAgent.match(query)) {
      return { name: ResourceAgent.name, alias: ResourceAgent.alias, description: ResourceAgent.description, icon: ResourceAgent.icon };
    }
    if (DisasterAgent.match(query)) {
      return { name: DisasterAgent.name, alias: DisasterAgent.alias, description: DisasterAgent.description, icon: DisasterAgent.icon };
    }

    // Default general-purpose agent in non-matching cases
    return {
      name: 'GeneralAgent',
      alias: 'Unified Comm Coordinator',
      description: 'Coordinates general inquiries, offline state reports, and evacuation schedules.',
      icon: 'ShieldAlert'
    };
  },

  // Language detector helper
  detectLanguage(query: string): string {
    const q = query.toLowerCase();
    
    // Tamil triggers
    if (q.match(/உதவி|வேண்டும்|காயம்|இரத்தம்|மறைவிடம்|வணக்கம்|புயல்|வெள்ளம்|சாப்பாடு/)) {
      return 'ta';
    }
    // Hindi triggers
    if (q.match(/मदद|चोट|खून|अस्पताल|भोजन|दबाव|चेतावनी|नमस्ते|बाढ़|भूकंप/)) {
      return 'hi';
    }
    // Ukrainian triggers
    if (q.match(/допомог|біль|джерело|укритт|обстріл|турнік|вибух|привіт|карта|вода/)) {
      return 'uk';
    }
    // Arabic triggers
    if (q.match(/مساعدة|نزيف|مستشفى|طعام|ماء|ملجأ|إنقاذ|طوارئ|حريق|زلزال/)) {
      return 'ar';
    }
    
    return 'en';
  },

  // Dynamic dispatch responder
  async getResponse(
    query: string,
    isOnline: boolean,
    lang: string,
    userLocation?: LatLng,
    markers: MapMarker[] = []
  ): Promise<{ text: string; agent: AgentDetails; isOnlineUsed: boolean }> {
    const resolvedAgent = this.route(query);
    const resolvedLang = lang !== 'en' ? lang : this.detectLanguage(query);

    // If online, perform the full smart LLM extraction using Server-Side Gemini API
    if (isOnline) {
      try {
        const response = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            agent: resolvedAgent.name,
            language: resolvedLang,
            location: userLocation,
            markers: markers.slice(0, 10).map(m => ({
              type: m.type,
              title: m.title,
              description: m.description,
              location: m.location
            })) // only send relevant core markers
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.text) {
            return {
              text: data.text,
              agent: resolvedAgent,
              isOnlineUsed: true
            };
          }
        }
      } catch (err) {
        console.warn('Online live Gemini endpoint failed. Dropping back to fully safe offline agent database:', err);
      }
    }

    // Offline computation fallback
    let responseText = '';
    switch (resolvedAgent.name) {
      case 'MedAgent':
        responseText = MedAgent.respondOffline(query, resolvedLang);
        break;
      case 'SurvivalAgent':
        responseText = SurvivalAgent.respondOffline(query, resolvedLang);
        break;
      case 'ResourceAgent':
        responseText = ResourceAgent.respondOffline(query, resolvedLang, userLocation, markers);
        break;
      case 'DisasterAgent':
        responseText = DisasterAgent.respondOffline(query, resolvedLang);
        break;
      default:
        // Generic fallback combining resources and comfort
        responseText = `### 🛰️ [OFFLINE GENERAL-AGENT]: Unified Comm Assistant

Your signal query: "${query}" has been registered inside our local Mesh Router database.

I've matched your request with our global crisis triage logic. Here are your safe operating constraints:

1. **Keep App in Foreground**: This device is acting as a passive peer-to-peer relay. Staying active extends overall grid radius for nearby civilians.
2. **First-Aid Resourcing**: If you have urgent cuts or broken limbs, type **"First Aid" or "Bleeding"** to trigger doctors immediately.
3. **Disaster Warnings**: If threatened by cyclones or high water rise, type **"Cyclone protocol" or "Flood danger"** to read cached checklists.
4. **Offline Map Coordinates**: Check the **Rescue Map** tab to locate cached Safe Shelters.

*Mesh Network health: Green. Active Nodes: 4. Power State: Optimal.*`;
    }

    return {
      text: responseText,
      agent: resolvedAgent,
      isOnlineUsed: false
    };
  }
};
