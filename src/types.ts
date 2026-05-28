/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'citizen' | 'volunteer' | 'government';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;           // UUID generated offline
  name: string;
  role: UserRole;
  skills?: string[];    // For volunteers
  location?: LatLng;
  lastSeen: number;     // Unix timestamp
  publicKey: string;    // For E2E encryption
}

export interface Message {
  id: string;
  from: string;         // User ID or name
  fromName: string;     // Dispatcher name
  to: string;           // User ID, Group ID, or 'all' for broadcasts
  type: 'text' | 'voice' | 'photo' | 'location' | 'broadcast';
  content: string;
  timestamp: number;
  priority: 'emergency' | 'important' | 'normal';
  hopCount: number;     // How many devices relayed this message
  encrypted: boolean;
  delivered: boolean;
  audioDuration?: number; // Secret audio note info
}

export type MarkerType = 'shelter' | 'hospital' | 'food' | 'danger' | 'invincibility' | 'missing_person';

export interface MapMarker {
  id: string;
  type: MarkerType;
  location: LatLng;
  title: string;
  description: string;
  reportedBy: string;   // User name or role
  verified: boolean;
  timestamp: number;
  contactNo?: string;   // Optional contact phone/radio channel
}

export type AidType = 'food' | 'medical' | 'financial' | 'shelter';
export type AidStatus = 'pending' | 'approved' | 'dispatched' | 'received';

export interface AidApplication {
  id: string;
  applicant: string;    // User ID
  applicantName: string;
  type: AidType;
  status: AidStatus;
  amount?: number;
  requestedAt: number;
  updatedAt: number;
  description?: string;
  photoEvidence?: string[]; // Base64 or local file paths
}

export interface RescueTask {
  id: string;
  type: 'medical' | 'evacuation' | 'supply' | 'search' | 'report';
  location: LatLng;
  urgency: 'critical' | 'high' | 'medium';
  assignedTo?: string;  // Volunteer User ID
  assignedToName?: string;
  status: 'open' | 'assigned' | 'en_route' | 'on_scene' | 'complete';
  createdBy: string;
  createdAt: number;
  title: string;
  description: string;
}

export type AppLanguage = 'en' | 'ta' | 'hi' | 'uk' | 'ar';
