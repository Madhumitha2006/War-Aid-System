/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SURVIVAL_GUIDES } from '../data/knowledgeBase';

export const MedAgent = {
  name: 'MedAgent',
  alias: 'Specialist Medical Triage AI',
  description: 'Handles emergency trauma care, tourniquet guidance, CPR, and infection control.',
  icon: 'Activity',

  match(query: string): boolean {
    const q = query.toLowerCase();
    return (
      q.includes('bleed') ||
      q.includes('wound') ||
      q.includes('blood') ||
      q.includes('tourniquet') ||
      q.includes('cpr') ||
      q.includes('burn') ||
      q.includes('fracture') ||
      q.includes('bone') ||
      q.includes('injury') ||
      q.includes('doctor') ||
      q.includes('med') ||
      q.includes('pain') ||
      q.includes('choking') ||
      q.includes('இரத்தம்') || // Tamil: blood
      q.includes('காயம்') ||  // Tamil: wound
      q.includes('चोट') ||     // Hindi: injury
      q.includes('खून') ||     // Hindi: blood
      q.includes('кров') ||    // Ukrainian: blood
      q.includes('ран')       // Ukrainian: wound
    );
  },

  respondOffline(query: string, lang: string = 'en'): string {
    const q = query.toLowerCase();

    if (q.includes('bleed') || q.includes('wound') || q.includes('blood') || q.includes('tourniquet') || q.includes('இரத்தம்') || q.includes('காயம்') || q.includes('кров')) {
      const guide = SURVIVAL_GUIDES.find(g => g.id === 'severe_bleeding');
      if (guide) {
        const title = guide.title[lang] || guide.title['en'];
        const steps = guide.steps[lang] || guide.steps['en'];
        const warn = guide.warning ? (guide.warning[lang] || guide.warning['en']) : '';
        return `### 🩺 [OFFLINE MED-AGENT]: ${title}\n\nI have matched your query with our cached Life-saving Medical Directives:\n\n${steps.map((s, idx) => `${idx + 1}. **${s}**`).join('\n')}\n\n${warn ? `**Warning:**\n${warn}` : ''}\n\n*MedAgent Offline Knowledge Base is fully autonomous. No cells active.*`;
      }
    }

    if (q.includes('burn') || q.includes('தீக்காயம்') || q.includes('अग्नि') || q.includes('опік')) {
      const guide = SURVIVAL_GUIDES.find(g => g.id === 'burn_treatment');
      if (guide) {
        const title = guide.title[lang] || guide.title['en'];
        const steps = guide.steps[lang] || guide.steps['en'];
        return `### 🩺 [OFFLINE MED-AGENT]: ${title}\n\nThermal Injury cooling sequence:\n\n${steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\nUse clean cling wrap to shelter skin from bacteria. Avoid grease or butter.`;
      }
    }

    // Default CPR sequence
    return `### 🩺 [OFFLINE MED-AGENT]: Cardiopulmonary Resuscitation (CPR) Guide

I've detected a clinical medical query regarding emergency CPR or life Support. Here is the fast backup protocol:

1. **Verify Consciousness & Breathing**: Tap shoulders, yell "Are you okay?". Scan chest for rise & fall.
2. **Access Airway**: Tilt head back slightly, lift chin.
3. **Dispatch Call**: Shout for nearby volunteers and mesh-broadcast "MED_EMERGENCY" with GPS coordinates immediately.
4. **Initiate Compressions**: Place heel of hand on center of chest (sternum). Push hard and fast: 100 to 120 compressions per minute at a depth of 2 inches (5 cm).
5. **Breaths**: (If trained) Provide 2 rescue breaths after every 30 compressions. Keep going until paramedics or tactical volunteers relieve you.

*Stay strong. Breathe steadily.*`;
  }
};
