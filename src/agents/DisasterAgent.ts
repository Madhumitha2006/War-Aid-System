/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DisasterAgent = {
  name: 'DisasterAgent',
  alias: 'Natural Crisis Advisor',
  description: 'Specializes in cyclone landfall, seismic tremors, flood vectors, and emergency evacuation drills.',
  icon: 'Flame',

  match(query: string): boolean {
    const q = query.toLowerCase();
    return (
      q.includes('cyclone') ||
      q.includes('hurricane') ||
      q.includes('storm') ||
      q.includes('flood') ||
      q.includes('river') ||
      q.includes('water rise') ||
      q.includes('earthquake') ||
      q.includes('quake') ||
      q.includes('shake') ||
      q.includes('tsunami') ||
      q.includes('fire') ||
      q.includes('வெள்ளம்') ||   // Tamil: flood
      q.includes('புயல்') ||      // Tamil: cyclone
      q.includes('भूकंप') ||       // Hindi: earthquake
      q.includes('बाढ़')          // Hindi: flood
    );
  },

  respondOffline(query: string, lang: string = 'en'): string {
    const q = query.toLowerCase();

    if (q.includes('cyclone') || q.includes('storm') || q.includes('hurricane') || q.includes('புயல்')) {
      return `### 🌀 [OFFLINE DISASTER-AGENT]: Cyclone & High-Wind Protocols

Key protective steps to withstand storm surges and violent cyclone winds:

1. **Secure Surroundings**: Board up glass windows. Secure loose outdoor objects (sheets, tin roofs, timber).
2. **Move to High Ground**: If residing in coastal lowland regions or catchments, evacuate immediately before storm surge channels swamp escape roads.
3. **Internal Shelter**: Locate a secure central closet or small bathroom without windows. Sit tightly under robust carpentry.
4. **Reserve Power**: Turn off main breakers before flood waters block access. Keep radios active.`;
    }

    if (q.includes('flood') || q.includes('water rise') || q.includes('வெள்ளம்') || q.includes('बाढ़')) {
      return `### 🌊 [OFFLINE DISASTER-AGENT]: Flood & Water Surge Guide

Important safety rules when escaping rapid rising water:

1. **Never Drive Through Floods**: Just 6 inches (15 cm) of rapid moving water will knock a grown adult down. 12 inches (30 cm) will float a multi-ton transport truck.
2. **Sub-Surface Hazards**: Avoid walking in standing water. It conceals open manholes, rusted structural iron, and live downed power cables.
3. **Vertical Evacuation**: If trapped, climb to the highest structural story or rooftop. Ensure you bring signaling materials (a bright towel, flags, or flashlight).
4. **Combat Disease**: Avoid raw floodwater. It is heavily contaminated with sewers and chemical residues. Boil or chemically sterilize all water.`;
    }

    return `### 🌋 [OFFLINE DISASTER-AGENT]: Earthquake & Seismic Shock Rescue

If seismic tremors occur:

1. **Drop, Cover, and Hold On**: Get down on hands and knees under solid steel or wooden tables. Hold on firmly until shaking ceases.
2. **Stay Inside**: Moving while building materials are shearing produces severe laceration casualties from window panes, roof slates, and loose brickwork.
3. **Subsequent Tremors**: Expect severe aftershocks within minutes to hours. Inspect walls for diagonal load splits before re-occupying rooms.
4. **Identify Flammable Pipes**: Instantly isolate gas headers and valve tanks to avoid structural infernos.`;
  }
};
