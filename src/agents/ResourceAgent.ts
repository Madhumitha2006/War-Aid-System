/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapMarker, LatLng } from '../types';

// Simple Euclidean/Haversine distance helper for finding nearest resources offline
function calculateDistance(c1: LatLng, c2: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export const ResourceAgent = {
  name: 'ResourceAgent',
  alias: 'Decentralized Supplies & Shelters Dispatcher',
  description: 'Calculates distances to registered safehouses, water drops, and Points of Invincibility.',
  icon: 'Package',

  match(query: string): boolean {
    const q = query.toLowerCase();
    return (
      q.includes('shelter') ||
      q.includes('nearest') ||
      q.includes('where is') ||
      q.includes('food') ||
      q.includes('water') ||
      q.includes('supply') ||
      q.includes('charging') ||
      q.includes('invincibility') ||
      q.includes('hospital') ||
      q.includes('medicine') ||
      q.includes('வைத்தியசாலை') || // Tamil: hospital
      q.includes('உணவு') ||         // Tamil: food
      q.includes('अस्पताल') ||     // Hindi: hospital
      q.includes('भोजन') ||         // Hindi: food
      q.includes('укриття') ||     // Ukrainian: shelter
      q.includes('вода')           // Ukrainian: water
    );
  },

  respondOffline(query: string, lang: string = 'en', userLocation?: LatLng, markersList: MapMarker[] = []): string {
    const q = query.toLowerCase();

    const loc = userLocation || { lat: 50.4485, lng: 30.5280 }; // Default Kiev centre

    // Filter resources
    let targetType: MapMarker['type'][] = [];
    if (q.includes('shelter') || q.includes('укриття') || q.includes('invincibility') || q.includes('மறைவிடம்') || q.includes('शरणालय')) {
      targetType = ['shelter', 'invincibility'];
    } else if (q.includes('food') || q.includes('water') || q.includes('supply') || q.includes('உணவு') || q.includes('भोजन') || q.includes('вода')) {
      targetType = ['food', 'invincibility'];
    } else if (q.includes('hospital') || q.includes('medicine') || q.includes('வைத்தியசாலை') || q.includes('अस्पताल') || q.includes('медицин')) {
      targetType = ['hospital'];
    } else {
      targetType = ['shelter', 'hospital', 'food', 'invincibility'];
    }

    const availableMarkers = markersList.filter(m => targetType.includes(m.type));

    if (availableMarkers.length === 0) {
      return `### 📍 [OFFLINE RESOURCE-AGENT]: Resource Dispatcher

No grid centers match your specific selection in the local mesh directory yet.

*User Location Context*: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}

**Default Kyiv Safe Reserves:**
- **Metro Stat. Golden Gate (Shelter)**: Sub-street deep blast protection. Deep Kyiv Center.
- **Point of Invincibility School #14**: Warm broth, stove heat & thermal blankets.

*Toggle "Online" in the header if you wish to query satellite coordination centers.*`;
    }

    // Map distances and sort
    const mapped = availableMarkers.map(m => {
      const dist = calculateDistance(loc, m.location);
      return { ...m, dist };
    }).sort((a, b) => a.dist - b.dist);

    const matchText = targetType.join(' / ').toUpperCase();
    let response = `### 📍 [OFFLINE RESOURCE-AGENT]: Registered Centers [${matchText}]\n\n`;
    response += `I computed distances from your current GPS grid node (**${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}**):\n\n`;

    mapped.forEach((m, idx) => {
      const verifiedTag = m.verified ? '✅ Verified Hub' : '⚠️ User Reported (Unverified)';
      const typeLabel = m.type === 'invincibility' ? '⚡ Point of Invincibility' : m.type === 'shelter' ? '🏠 Armored Shelter' : m.type === 'hospital' ? '🏥 Hospital' : '🍞 Supply Point';
      response += `${idx + 1}. **${m.title}** (${typeLabel})\n`;
      response += `   * **Distance**: ${m.dist.toFixed(2)} km away\n`;
      response += `   * **Sector**: ${verifiedTag}\n`;
      response += `   * **Status/Inventory**: ${m.description}\n\n`;
    });

    response += `*Always travel in pairs. Avoid visible streets during drone search sweeps.*`;
    return response;
  }
};
