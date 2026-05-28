/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SURVIVAL_GUIDES } from '../data/knowledgeBase';

export const SurvivalAgent = {
  name: 'SurvivalAgent',
  alias: 'Specialist Survival Instructor',
  description: 'Handles artillery bombardments, structural entrapments, radioactive events, and shelter setups.',
  icon: 'Shield',

  match(query: string): boolean {
    const q = query.toLowerCase();
    return (
      q.includes('shell') ||
      q.includes('artillery') ||
      q.includes('shoot') ||
      q.includes('bomb') ||
      q.includes('blast') ||
      q.includes('missile') ||
      q.includes('attack') ||
      q.includes('collapse') ||
      q.includes('trap') ||
      q.includes('rubble') ||
      q.includes('radiation') ||
      q.includes('nuclear') ||
      q.includes('обстріл') || // Ukrainian: shelling
      q.includes('вибух') ||    // Ukrainian: explosion
      q.includes('बम') ||       // Hindi: bomb
      q.includes('தாக்குதல்')   // Tamil: attack
    );
  },

  respondOffline(query: string, lang: string = 'en'): string {
    const q = query.toLowerCase();

    if (q.includes('shell') || q.includes('bomb') || q.includes('artillery') || q.includes('missile') || q.includes('обстріл') || q.includes('தாக்குதல்')) {
      const guide = SURVIVAL_GUIDES.find(g => g.id === 'shelling_survival');
      if (guide) {
        const title = guide.title[lang] || guide.title['en'];
        const steps = guide.steps[lang] || guide.steps['en'];
        const warn = guide.warning ? (guide.warning[lang] || guide.warning['en']) : '';
        return `### 🪖 [OFFLINE SURVIVAL-AGENT]: ${title}\n\nImmediate actions to safeguard life under direct bombardment:\n\n${steps.map((s, idx) => `${idx + 1}. **${s}**`).join('\n')}\n\n${warn ? `**Aesthetic Warning:**\n${warn}` : ''}`;
      }
    }

    if (q.includes('radiation') || q.includes('nuclear') || q.includes('атом')) {
      return `### ⚛️ [OFFLINE SURVIVAL-AGENT]: Nuclear / Hazardous Particle Containment

If a chemical, biological, or radiological event is declared:

1. **Go Deep Indoors**: Put maximum physical walls (concrete, brick, dirt) between you and the out-of-doors. Basements are critical.
2. **Conseal Openings**: Tape plastic sheet overlays on ventilation, flue pipes, window seams and door cracks. Turn off circulating heaters.
3. **Decontaminate**: If caught outside, strip clothing in plastic bin, wash hair/skin with soap immediately. Do NOT use hair conditioner (it bonds radioactive dust).
4. **Hydrate Deeply**: Eat only shelf-stable tinned food and drink from sealed bottles. Avoid rain water.`;
    }

    return `### 🪖 [OFFLINE SURVIVAL-AGENT]: Structural Entrapment & Under-Rubble Guide

If trapped in a structure failure or bunker blockage:

1. **Protect Airway**: Wrap a shirt or scarf over your mouth and nose to prevent breathing thick dust slurry.
2. **Stay Still**: Avoid thrashing or kicking. It will raise clouds of blinding dust and exhaust precious oxygen.
3. **Signal Efficiently**: Do not shout unless you hear rescue teams directly above. Shouting dries airway and saps voice. Instead, find a pipe, iron bar, or floor slate and rhythmically TAP "3 taps, pause, repeat" (SOS). Sound travels exceptionally well through concrete beams.
4. **Verify Surrounding Voids**: Move small pieces of ceiling rubble carefully to explore any breathing draft, checking structural stress beforehand.`;
  }
};
