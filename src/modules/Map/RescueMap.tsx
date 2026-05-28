/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, ShieldAlert, Crosshair, MapPin, Layers, 
  Plus, Calendar, CheckCircle2, UserCheck, Trash2, 
  HelpCircle, Compass, Route, Info, Eye, EyeOff, 
  Navigation, RefreshCw, AlertTriangle, Map 
} from 'lucide-react';
import { MapMarker, LatLng, MarkerType } from '../../types';

interface Props {
  markers: MapMarker[];
  currentUserLocation: LatLng;
  onAddMarker: (marker: Omit<MapMarker, 'id' | 'timestamp' | 'verified'>) => void;
  onVerifyMarker: (id: string) => void;
  onDeleteMarker: (id: string) => void;
  currentUser: { name: string; role: string };
  emergencyMode: boolean;
}

// Kyiv Tactical Street Route Schema for the high-visibility offline simulator
interface StreetRoute {
  id: string;
  name: string;
  points: LatLng[];
  type: 'highway' | 'arterial' | 'bridge';
  status: 'clear' | 'warning' | 'blocked';
  statusDesc: string;
}

const CONST_COLORS: Record<MarkerType, string> = {
  shelter: '#1D9E75', // Relief Green
  hospital: '#E24B4A', // Alert Red
  food: '#E8550A', // Emergency Orange
  danger: '#EF4444', // Danger Red
  invincibility: '#EAB308', // Yellow Accent
  missing_person: '#A855F7' // Purple
};

// Initial pre-seeded arterial streets representing major Kiev routes inside our coordination grid
const DEFAULT_STREETS: StreetRoute[] = [
  {
    id: 'road-beresteiskyi',
    name: "Beresteiskyi (Peremohy) Ave",
    type: 'highway',
    status: 'clear',
    statusDesc: "Secondary Westward Evacuation Highway. Volunteer checkpoints secure.",
    points: [
      { lat: 50.455, lng: 30.491 },
      { lat: 50.450, lng: 30.505 },
      { lat: 50.446, lng: 30.514 },
      { lat: 50.442, lng: 30.519 }
    ]
  },
  {
    id: 'road-naberezhne',
    name: "Naberezhne Riverside Hwy",
    type: 'highway',
    status: 'clear',
    statusDesc: "Major fast route running along the Dnieper River bank. Recommended for emergency service transport.",
    points: [
      { lat: 50.468, lng: 30.521 },
      { lat: 50.457, lng: 30.528 },
      { lat: 50.445, lng: 30.541 },
      { lat: 50.433, lng: 30.545 }
    ]
  },
  {
    id: 'road-khreshchatyk',
    name: "Khreshchatyk Center Axis",
    type: 'arterial',
    status: 'clear',
    statusDesc: "Downtown center boulevard. Well guarded. Highly accessible for volunteer delivery riders.",
    points: [
      { lat: 50.443, lng: 30.505 },
      { lat: 50.444, lng: 30.518 },
      { lat: 50.449, lng: 30.524 }
    ]
  },
  {
    id: 'road-lesi',
    name: "Lesi Ukrainky Blvd Corridor",
    type: 'arterial',
    status: 'warning',
    statusDesc: "Minor rubble blocks 1 lane near Pechersk area. Clear with caution.",
    points: [
      { lat: 50.441, lng: 30.522 },
      { lat: 50.435, lng: 30.536 },
      { lat: 50.428, lng: 30.544 }
    ]
  },
  {
    id: 'road-paton',
    name: "Paton Bridge (Main Connector)",
    type: 'bridge',
    status: 'clear',
    statusDesc: "Trans-Dnieper corridor. Open for heavy relief supplies under volunteer guard.",
    points: [
      { lat: 50.430, lng: 30.541 },
      { lat: 50.431, lng: 30.547 },
      { lat: 50.431, lng: 30.552 }
    ]
  },
  {
    id: 'road-metro-bridge',
    name: "Metro Transit Bridge",
    type: 'bridge',
    status: 'blocked',
    statusDesc: "Major structural blockage. Strictly impassable for vehicles. Safe for foot traffic only.",
    points: [
      { lat: 50.442, lng: 30.537 },
      { lat: 50.444, lng: 30.542 },
      { lat: 50.445, lng: 30.547 }
    ]
  }
];

export default function RescueMap({
  markers,
  currentUserLocation,
  onAddMarker,
  onVerifyMarker,
  onDeleteMarker,
  currentUser,
  emergencyMode
}: Props) {
  // Filters for marker display layers
  const [selectedFilters, setSelectedFilters] = useState<MarkerType[]>([
    'shelter', 'hospital', 'food', 'danger', 'invincibility', 'missing_person'
  ]);
  
  // Sidebar Tabs state
  const [sidebarTab, setSidebarTab] = useState<'intel' | 'streets' | 'routing'>('intel');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(markers[0] || null);

  // Form for dropping custom reporting pin
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<MarkerType>('danger');
  const [newLat, setNewLat] = useState<number>(50.4501);
  const [newLng, setNewLng] = useState<number>(30.5234);

  // High Fidelity Offline Map customization layers
  const [showWaterways, setShowWaterways] = useState(true);
  const [showStreets, setShowStreets] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(true);

  // Local street route network state for offline status toggle
  const [streets, setStreets] = useState<StreetRoute[]>(DEFAULT_STREETS);
  const [selectedRouteOnList, setSelectedRouteOnList] = useState<StreetRoute | null>(null);

  // Interactive Pathway Router state
  const [routingDestinationId, setRoutingDestinationId] = useState<string>('');
  const [routingSafetyBypass, setRoutingSafetyBypass] = useState<'safest' | 'shortest'>('safest');

  // Set selected marker automatically when changed from filters or lists
  const eligibleMarkers = markers.filter(m => selectedFilters.includes(m.type));

  const handleFilterToggle = (type: MarkerType) => {
    setSelectedFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddMarkerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddMarker({
      type: newType,
      location: { lat: Number(newLat) || 50.45, lng: Number(newLng) || 30.52 },
      title: newTitle,
      description: newDescription,
      reportedBy: currentUser.name
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddForm(false);
  };

  // Keep route planner updated if markers change
  useEffect(() => {
    if (markers.length > 0 && !selectedMarker) {
      setSelectedMarker(markers[0]);
    }
  }, [markers]);

  // Keep lat/lng synced with user location on opening droppin dialog
  useEffect(() => {
    if (currentUserLocation) {
      setNewLat(Number(currentUserLocation.lat.toFixed(4)));
      setNewLng(Number(currentUserLocation.lng.toFixed(4)));
    }
  }, [currentUserLocation, showAddForm]);

  // Set default routing destination to the first shelter marker if present
  useEffect(() => {
    const firstShelter = markers.find(m => m.type === 'shelter');
    if (firstShelter) {
      setRoutingDestinationId(firstShelter.id);
    } else if (markers.length > 0) {
      setRoutingDestinationId(markers[0].id);
    }
  }, [markers]);

  // Kiev Tactical Grid dimensions mapping real coordinates
  const mapWidth = 800;
  const mapHeight = 500;
  const minLat = 50.43;
  const maxLat = 50.47;
  const minLng = 30.49;
  const maxLng = 30.55;

  // Converts coordinate lat/lng values smoothly to flat SVG coordinate points
  const convertCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = mapHeight - ((lat - minLat) / (maxLat - minLat)) * mapHeight;
    return { 
      x: Math.max(15, Math.min(mapWidth - 15, x)), 
      y: Math.max(15, Math.min(mapHeight - 15, y)) 
    };
  };

  const userPos = currentUserLocation ? convertCoords(currentUserLocation.lat, currentUserLocation.lng) : null;

  // Triggers dropping pin modal at the clicked vector coordinates directly
  const handleMapGridClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = clickX / rect.width;
    const percentY = 1 - (clickY / rect.height);

    const calculatedLng = minLng + percentX * (maxLng - minLng);
    const calculatedLat = minLat + percentY * (maxLat - minLat);

    setNewLat(Number(calculatedLat.toFixed(4)));
    setNewLng(Number(calculatedLng.toFixed(4)));
    setShowAddForm(true);
  };

  // Toggle route condition status locally in mesh environment (simulates offline distributed state)
  const toggleStreetStatus = (routeId: string) => {
    setStreets(prev => prev.map(street => {
      if (street.id === routeId) {
        let nextStatus: 'clear' | 'warning' | 'blocked' = 'clear';
        let desc = "Route clear of obstacles";
        if (street.status === 'clear') {
          nextStatus = 'warning';
          desc = "Obstacles/debris reported. Speed advisory in place.";
        } else if (street.status === 'warning') {
          nextStatus = 'blocked';
          desc = "Blocked. Path obstructed by concrete debris or fire.";
        } else {
          nextStatus = 'clear';
          desc = "Route inspected and declared secure.";
        }
        return { ...street, status: nextStatus, statusDesc: desc };
      }
      return street;
    }));
  };

  // CORE ROUTING ENGINE: Path calculation bypassing threat/hazard circle nodes dynamically
  const calculateNavigationRoutingPoints = () => {
    if (!userPos) return null;
    const targetMarker = markers.find(m => m.id === routingDestinationId);
    if (!targetMarker) return null;

    const destPos = convertCoords(targetMarker.location.lat, targetMarker.location.lng);
    let pathPoints = [userPos, destPos];
    let bended = false;
    let bypassedThreatTitle = "";

    // If 'safest' mode is active, check if the routing line intercepts any active Red threat circle nodes
    if (routingSafetyBypass === 'safest') {
      const dangerMarkers = eligibleMarkers.filter(m => m.type === 'danger');
      const segmentMidX = (userPos.x + destPos.x) / 2;
      const segmentMidY = (userPos.y + destPos.y) / 2;

      // Identify if there is a threat close to the logical pathway midpoint
      const hazardousNode = dangerMarkers.find(dm => {
        const dmPos = convertCoords(dm.location.lat, dm.location.lng);
        const distance = Math.sqrt((segmentMidX - dmPos.x) ** 2 + (segmentMidY - dmPos.y) ** 2);
        return distance < 75; // hazard threat radius impact proximity
      });

      if (hazardousNode) {
        bended = true;
        bypassedThreatTitle = hazardousNode.title;
        const dmPos = convertCoords(hazardousNode.location.lat, hazardousNode.location.lng);
        
        // Calculate perpendicular vectors to detour around the blockade circle safely
        const dx = destPos.x - userPos.x;
        const dy = destPos.y - userPos.y;
        const lineLen = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const perpX = -dy / lineLen;
        const perpY = dx / lineLen;

        // Route left side detour or right side detour based on furthest distance from center of threat
        const detour1X = segmentMidX + 80 * perpX;
        const detour1Y = segmentMidY + 80 * perpY;
        const detour2X = segmentMidX - 80 * perpX;
        const detour2Y = segmentMidY - 80 * perpY;

        const d1Dist = Math.sqrt((detour1X - dmPos.x) ** 2 + (detour1Y - dmPos.y) ** 2);
        const d2Dist = Math.sqrt((detour2X - dmPos.x) ** 2 + (detour2Y - dmPos.y) ** 2);

        const chosenDetour = d1Dist > d2Dist ? { x: detour1X, y: detour1Y } : { x: detour2X, y: detour2Y };

        pathPoints = [
          userPos,
          { x: chosenDetour.x, y: chosenDetour.y },
          destPos
        ];
      }
    }

    return {
      points: pathPoints,
      bended,
      bypassedThreatTitle,
      length: Math.round(Math.sqrt((destPos.x - userPos.x) ** 2 + (destPos.y - userPos.y) ** 2) * 5.4), // mock distance metric
      targetMarker
    };
  };

  const activeRouting = calculateNavigationRoutingPoints();

  return (
    <div id="rescue-map-container" className="space-y-4 my-2">
      
      {/* Visual Overlay Header and Toggles */}
      <div id="map-control-hub" className="flex flex-wrap gap-2 items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wider text-zinc-100 uppercase font-display">Resilient Local Grid Map</h3>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
            Kyiv Coordination Sector • Dual Mode: Interactive Offline Tactical Vectors (100% stable without Internet)
          </p>
        </div>

        <button
          id="trigger-add-pin-btn"
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Drop Custom Hazard Pin</span>
        </button>
      </div>

      {/* Map display customizer options toolbar */}
      <div id="map-customizer-toolbar" className="flex flex-wrap gap-2 items-center justify-between bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/80">
        <div className="flex flex-wrap gap-3 items-center text-xs text-zinc-400">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
            <Map className="w-3.5 h-3.5" /> Overlays:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showWaterways} 
              onChange={() => setShowWaterways(!showWaterways)} 
              className="accent-cyan-500 rounded border-zinc-800" 
            />
            <span className={showWaterways ? "text-zinc-200" : "text-zinc-500"}>🌊 River & Canals</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showStreets} 
              onChange={() => setShowStreets(!showStreets)} 
              className="accent-emerald-500 rounded border-zinc-800" 
            />
            <span className={showStreets ? "text-zinc-200" : "text-zinc-500"}>🛣️ Transit Streets</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showNeighborhoods} 
              onChange={() => setShowNeighborhoods(!showNeighborhoods)} 
              className="accent-yellow-500 rounded border-zinc-800" 
            />
            <span className={showNeighborhoods ? "text-zinc-200" : "text-zinc-500"}>🏘️ Kiev District Tags</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showGridOverlay} 
              onChange={() => setShowGridOverlay(!showGridOverlay)} 
              className="accent-zinc-500 rounded border-zinc-800" 
            />
            <span className={showGridOverlay ? "text-zinc-200" : "text-zinc-500"}>📐 Sector Labels</span>
          </label>
        </div>

        <button 
          onClick={() => {
            setStreets(DEFAULT_STREETS);
            setSelectedRouteOnList(null);
          }}
          title="Restore original routes database state"
          className="p-1 px-2 border border-zinc-800 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 flex items-center gap-1 cursor-pointer font-mono"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Network</span>
        </button>
      </div>

      {/* Target Marker Layer Toggles strip */}
      <div id="map-layer-filter-strip" className="flex flex-wrap gap-1.5 items-center bg-zinc-950/20 p-2 rounded-lg border border-zinc-800/50">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 px-1.5 font-mono">
          <Layers className="w-3 h-3 text-cyan-500" />
          Entity Layers:
        </span>

        <button
          id="filter-shelters-btn"
          onClick={() => handleFilterToggle('shelter')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('shelter') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>🏠 Shelters</span>
        </button>

        <button
          id="filter-hospitals-btn"
          onClick={() => handleFilterToggle('hospital')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('hospital') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>🏥 Field Hospitals</span>
        </button>

        <button
          id="filter-food-btn"
          onClick={() => handleFilterToggle('food')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('food') ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>🍞 Supply Points</span>
        </button>

        <button
          id="filter-dangers-btn"
          onClick={() => handleFilterToggle('danger')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('danger') ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>⚠️ Threat Zones</span>
        </button>

        <button
          id="filter-invincibility-btn"
          onClick={() => handleFilterToggle('invincibility')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('invincibility') ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>⚡ Points of Care</span>
        </button>

        <button
          id="filter-missing-person-btn"
          onClick={() => handleFilterToggle('missing_person')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all cursor-pointer ${
            selectedFilters.includes('missing_person') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium' : 'text-zinc-500 border border-transparent opacity-50'
          }`}
        >
          <span>👤 Missing Persons</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Core Vector Grid Map Canvas (Simulates complete offline vector google style rendering) */}
        <div className="lg:col-span-2 relative border rounded-xl overflow-hidden border-zinc-800 bg-[#070D19] min-h-[350px]">
          {/* Grid Background lines */}
          <div className="absolute inset-0 select-none pointer-events-none opacity-[0.03]">
            <div className="w-full h-full bg-[linear-gradient(to_right,#FFF_1px,transparent_1px),linear-gradient(to_bottom,#FFF_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <svg 
            id="tactical-vector-live-map"
            viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
            className="w-full h-full min-h-[350px] max-h-[500px] cursor-crosshair block"
            onClick={handleMapGridClick}
          >
            {/* 1. SECTOR RADAR IDENTIFIER TEXT OVERLAY */}
            {showGridOverlay && (
              <g opacity="0.12" fontSize="7.5" fill="#94A3B8" fontFamily="monospace" fontWeight="bold">
                {Array.from({ length: 8 }).map((_, col) => 
                  Array.from({ length: 5 }).map((_, row) => {
                    const cellName = `SEC-${String.fromCharCode(65 + row)}${col + 1}`;
                    return (
                      <text key={`${col}-${row}`} x={(col * mapWidth) / 8 + 6} y={(row * mapHeight) / 5 + 14}>
                        {cellName}
                      </text>
                    );
                  })
                ) as any}
                {/* Visual coordinate lines */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line key={`v-${i}`} x1={((i + 1) * mapWidth) / 8} y1="0" x2={((i + 1) * mapWidth) / 8} y2={mapHeight} stroke="#FFF" strokeWidth="0.5" strokeDasharray="5,15" />
                ))}
                {/* Horizontal coordinate lines */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={((i + 1) * mapHeight) / 5} x2={mapWidth} y2={((i + 1) * mapHeight) / 5} stroke="#FFF" strokeWidth="0.5" strokeDasharray="5,15" />
                ))}
              </g>
            )}

            {/* 2. RIVER WATERWAY LAYER */}
            {showWaterways && (
              <g id="waterways-layer">
                {/* Main blue Dnieper ribbon segment */}
                <path
                  d="M 450,-10 C 470,80 430,170 480,260 C 510,310 535,390 525,440 C 520,470 545,510 545,520"
                  fill="none"
                  stroke="#1E3A8A"
                  strokeWidth="26"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 450,-10 C 470,80 430,170 480,260 C 510,310 535,390 525,440 C 520,470 545,510 545,520"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.25"
                />
                {/* Trukhaniv Island park area */}
                <path
                  d="M 465,120 C 470,110 490,95 505,115 C 500,140 480,185 465,170 Z"
                  fill="#064E3B"
                  stroke="#10B981"
                  strokeWidth="0.5"
                  opacity="0.22"
                />
              </g>
            )}

            {/* 3. ROADS & RESILIENT HIGHWAYS OVERLAY */}
            {showStreets && (
              <g id="streets-routing-layer">
                {streets.map((route) => {
                  const svgPoints = route.points.map(p => convertCoords(p.lat, p.lng));
                  const pathData = svgPoints.reduce((acc, pt, idx) => {
                    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
                  }, '');

                  const isSelected = selectedRouteOnList?.id === route.id;
                  
                  // Style colors based on real-time transit status
                  let routeStroke = '#10B981'; // clear (Green)
                  if (route.status === 'warning') routeStroke = '#F59E0B'; // warning (Orange)
                  if (route.status === 'blocked') routeStroke = '#EF4444'; // blocked (Red)

                  return (
                    <g 
                      key={route.id}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open streets tab inside sidebar
                        setSidebarTab('streets');
                        setSelectedRouteOnList(route);
                      }}
                    >
                      {/* Interactive broad click detection base */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#0D1E3A"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                      />
                      {/* Asphalt dark ribbon core */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isSelected ? "#64748B" : "#1E293B"}
                        strokeWidth="6.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                      />
                      {/* Functional active state line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={routeStroke}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={isSelected ? "1" : "0.75"}
                      />
                      {/* Evacuation traffic moving dots animation for clear paths */}
                      {route.status === 'clear' && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#FFF"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeDasharray="4,24"
                          className="animate-map-dash"
                          opacity="0.9"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* 4. TACTICAL DISTRICTS LABEL MARKERS */}
            {showNeighborhoods && (
              <g id="neighborhoods-layer" pointerEvents="none" opacity="0.32" fontSize="7" fill="#F1F5F9" fontFamily="monospace" fontWeight="bold">
                {/* Kyiv landmarks with localized coordinate placement */}
                <text x="210" y="270" textAnchor="middle">PODIL HISTORIC DISTRICT</text>
                <text x="350" y="240" textAnchor="middle">✉ SHEVCHENKIVSKYI CENTER</text>
                <text x="470" y="160" textAnchor="middle">🌳 TRUKHANIV FOREST</text>
                <text x="370" y="320" textAnchor="middle">🏛️ PECHERSK HIGH DISTRICT</text>
                <text x="180" y="440" textAnchor="middle">⚓ SOLOMIANSK SECTOR</text>
                <text x="590" y="380" textAnchor="middle">👥 DARNYTSIA VOLUNTEER CORE</text>
                
                {/* River label */}
                {showWaterways && (
                  <text x="495" y="480" textAnchor="middle" fill="#0EA5E9" fontSize="8" transform="rotate(-75, 495, 480)">DNIPRO RIVER Evac Corridor</text>
                )}
              </g>
            )}

            {/* 5. HAZARD THREAT CIRCLES & ACTIVE IMPACT RANGE */}
            {eligibleMarkers.filter(m => m.type === 'danger').map((m) => {
              const pos = convertCoords(m.location.lat, m.location.lng);
              return (
                <g key={`danger-circle-${m.id}`} id={`danger-vector-circle-${m.id}`}>
                  {/* Danger zone hazard boundary */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="52" 
                    fill="#EF4444" 
                    fillOpacity="0.08" 
                    stroke="#EF4444" 
                    strokeWidth="1.2" 
                    strokeDasharray="4,5.5" 
                    className={emergencyMode ? '' : 'animate-pulse'}
                  />
                  {/* Outer pulsating danger alert ring */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="52"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.2"
                    className="animate-signal-pulse"
                  />
                  {/* Center spot bullet */}
                  <circle cx={pos.x} cy={pos.y} r="3" fill="#EF4444" />
                </g>
              );
            })}

            {/* 6. INTERACTIVE ROUTING ENGINE PATH OVERLAY */}
            {activeRouting && userPos && (
              <g id="tactical-active-routing-overlay">
                {(() => {
                  const pathDataString = activeRouting.points.reduce((acc, pt, idx) => {
                    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
                  }, '');

                  return (
                    <>
                      {/* Backup thick dark route support shadow */}
                      <path
                        d={pathDataString}
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                      {/* Active green signal line */}
                      <path
                        d={pathDataString}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.85"
                      />
                      {/* Animated running dots indicating evacuations route direction */}
                      <path
                        d={pathDataString}
                        fill="none"
                        stroke="#FFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="10, 14"
                        className="animate-map-dash"
                      />
                      
                      {/* Display small detour icons if safety router bended around threat nodes */}
                      {activeRouting.bended && activeRouting.points[1] && (
                        <g transform={`translate(${activeRouting.points[1].x}, ${activeRouting.points[1].y - 12})`}>
                          <rect x="-35" y="-10" width="70" height="15" rx="3" fill="#F59E0B" fillOpacity="0.95" />
                          <text x="0" y="1" fill="#000" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">DETOUR ACTIVE</text>
                        </g>
                      )}
                    </>
                  );
                })()}
              </g>
            )}

            {/* 7. ALL ELIGIBLE ENTITY ARRAYS (PINS) */}
            {eligibleMarkers.map((m) => {
              if (m.type === 'danger') return null; // Hazards handled with circles above
              const pos = convertCoords(m.location.lat, m.location.lng);
              const color = CONST_COLORS[m.type] || '#FFF';
              const isSelected = selectedMarker?.id === m.id;

              return (
                <g 
                  key={`marker-${m.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(m);
                    setSidebarTab('intel'); // switch tab onto inspector
                  }}
                  className="cursor-pointer group"
                  id={`vector-pin-element-${m.id}`}
                >
                  {/* Pin Selection ring marker */}
                  {isSelected && (
                    <circle 
                      cx={pos.x} 
                      cy={pos.y} 
                      r="15" 
                      fill="none" 
                      stroke={color} 
                      strokeWidth="2" 
                      opacity="0.9"
                      className="animate-pulse"
                    />
                  )}
                  {/* Pulse behind icons */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="8.5" 
                    fill={color} 
                    fillOpacity="0.2" 
                    className="opacity-60 group-hover:opacity-100 transition-all scale-100 group-hover:scale-125"
                  />
                  {/* Pin body center core */}
                  <polygon 
                    points={`${pos.x},${pos.y+5} ${pos.x-4},${pos.y-2} ${pos.x+4},${pos.y-2}`}
                    fill={color}
                    stroke="#111827"
                    strokeWidth="0.8"
                  />
                  <circle 
                    cx={pos.x} 
                    cy={pos.y-2} 
                    r="5" 
                    fill={color} 
                    stroke="#111827" 
                    strokeWidth="1.2"
                  />
                  {/* Tiny light center dot */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y-2} 
                    r="1.8" 
                    fill="#FFF" 
                  />
                </g>
              );
            })}

            {/* 8. CURRENT USER LIVE LOCATION INDICATOR */}
            {userPos && (
              <g id="current-user-gps-dot">
                <circle
                  cx={userPos.x}
                  cy={userPos.y}
                  r="13"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  className="animate-signal-pulse"
                />
                <circle
                  cx={userPos.x}
                  cy={userPos.y}
                  r="7"
                  fill="#10B981"
                  stroke="#FFF"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* 9. STATS OVERLAY DECK & COMPASS */}
            <g fontStyle="italic" fontSize="8.5" fill="#94A3B8" fontFamily="monospace" transform="translate(15, 460)">
              <text x="0" y="0">🧭 OFFLINE VECTOR COMPASS • SCALE: 1 GRID CELL = 4.2 KM</text>
              <line x1="0" y1="8" x2="160" y2="8" stroke="#475569" strokeWidth="1" />
              <line x1="0" y1="4" x2="0" y2="12" stroke="#475569" strokeWidth="1" />
              <line x1="80" y1="4" x2="80" y2="12" stroke="#475569" strokeWidth="1" />
              <line x1="160" y1="4" x2="160" y2="12" stroke="#475569" strokeWidth="1" />
              <text x="165" y="11" letterSpacing="1">SECURE VECTOR GRID LAYER LOADED</text>
            </g>
          </svg>

          {/* Quick tips panel */}
          <div className="absolute top-2 right-2 bg-slate-950/90 border border-zinc-800 text-[9px] p-2 rounded text-zinc-400 max-w-xs font-mono select-none">
            💡 Click anywhere in any grid cell coordinates to dispatch and drop a custom hazard, food spot, or rescue pin.
          </div>
        </div>

        {/* Dynamic Sidebar Control Desk */}
        <div id="selected-pin-info-panel" className="border rounded-xl bg-zinc-950/30 border-zinc-800 flex flex-col h-[400px] lg:h-auto overflow-hidden">
          
          {/* Tabs bar */}
          <div className="flex border-b border-zinc-800 bg-zinc-950/60 font-mono">
            <button
              onClick={() => setSidebarTab('intel')}
              className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 border-r border-zinc-800 cursor-pointer ${
                sidebarTab === 'intel' ? 'text-cyan-400 bg-cyan-950/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Intel</span>
            </button>
            <button
              onClick={() => setSidebarTab('streets')}
              className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 border-r border-zinc-800 cursor-pointer ${
                sidebarTab === 'streets' ? 'text-emerald-400 bg-emerald-950/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Streets</span>
            </button>
            <button
              onClick={() => setSidebarTab('routing')}
              className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                sidebarTab === 'routing' ? 'text-yellow-400 bg-yellow-950/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Planner</span>
            </button>
          </div>

          <div className="p-3.5 flex-1 overflow-y-auto space-y-4">

            {/* TAB 1: PIN INTEL INFORMATION DESK */}
            {sidebarTab === 'intel' && (
              <div className="space-y-3">
                {selectedMarker ? (
                  <div className="space-y-3" id={`selected-marker-view-${selectedMarker.id}`}>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[9px] font-bold py-0.5 px-2 rounded font-mono text-white tracking-wider"
                        style={{ backgroundColor: CONST_COLORS[selectedMarker.type] }}
                      >
                        {selectedMarker.type.replace('_', ' ').toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(selectedMarker.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{selectedMarker.title}</h4>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed bg-zinc-950/40 p-2.5 rounded border border-zinc-900">{selectedMarker.description}</p>
                    </div>

                    <div className="border-t border-zinc-900 pt-3 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span>Reported By:</span>
                        <span className="text-zinc-200">{selectedMarker.reportedBy}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span>Sectors Grid GPS:</span>
                        <span className="text-zinc-200 font-bold">
                          {selectedMarker.location.lat.toFixed(4)}°N, {selectedMarker.location.lng.toFixed(4)}°E
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span>Security Check:</span>
                        <span className={`font-semibold ${selectedMarker.verified ? 'text-emerald-400' : 'text-amber-500'}`}>
                          {selectedMarker.verified ? '✓ Verified Safe' : '⚠️ Unverified Report'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons panel */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {!selectedMarker.verified && currentUser.role === 'government' && (
                        <button
                          id={`verify-pin-btn-${selectedMarker.id}`}
                          onClick={() => {
                            onVerifyMarker(selectedMarker.id);
                            setSelectedMarker(prev => prev ? { ...prev, verified: true } : null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Official Status</span>
                        </button>
                      )}

                      {(currentUser.role === 'government' || selectedMarker.reportedBy === currentUser.name) && (
                        <button
                          id={`delete-pin-btn-${selectedMarker.id}`}
                          onClick={() => {
                            onDeleteMarker(selectedMarker.id);
                            setSelectedMarker(null);
                          }}
                          className="bg-red-950/40 hover:bg-red-950/70 border border-red-900/30 text-rose-450 text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer ml-auto transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge Point</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-zinc-500 flex flex-col items-center justify-center space-y-2 py-10">
                    <MapPin className="w-8 h-8 stroke-1 stroke-zinc-700" />
                    <p className="text-xs font-semibold">Select any node spot on the vector map grid array to inspect its sector reports, safe status, and volunteer intelligence logs.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STREETS & TRANSIT NETWORK MONITOR PANEL */}
            {sidebarTab === 'streets' && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase">Highway Grid Status</h4>
                  <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 font-mono">OFFLINE MESH DB</span>
                </div>
                
                <p className="text-[10px] text-zinc-400">
                  Select a resilient primary evacuation route to inspect detailed conditions, blockages, or manually shift its status.
                </p>

                <div className="space-y-2">
                  {streets.map((route) => {
                    const isSelected = selectedRouteOnList?.id === route.id;
                    const statusColor = route.status === 'clear' ? 'bg-emerald-500 text-emerald-400' : route.status === 'warning' ? 'bg-amber-500 text-amber-400' : 'bg-red-500 text-red-400';

                    return (
                      <div 
                        key={route.id}
                        onClick={() => setSelectedRouteOnList(route)}
                        className={`text-xs p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-900/80 border-slate-700' 
                            : 'bg-zinc-950/50 border-zinc-800/80 hover:bg-zinc-900/40 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-zinc-200">{route.name}</span>
                          <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-zinc-950/90 capitalize ${statusColor.split(' ')[1]}`}>
                            {route.status}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-zinc-450 leading-relaxed">
                          {route.statusDesc}
                        </div>

                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                            <span className="text-[9px] text-zinc-500 italic block">Route Type: {route.type.toUpperCase()}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStreetStatus(route.id);
                              }}
                              className="text-[9.5px] hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-mono transition-colors border border-zinc-700 cursor-pointer"
                            >
                              Toggle Transit Status
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TACTICAL ROUTE PLANNER (PATHFINDER) */}
            {sidebarTab === 'routing' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase">Evacuation Pathfinder</h4>
                  <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 font-mono bg-amber-500/10 text-amber-400">COORDINATOR</span>
                </div>

                {!userPos ? (
                  <div className="p-4 bg-amber-950/20 rounded border border-amber-900/30 text-amber-550 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-1.5 opacity-80" />
                    <p className="text-[11px]">Your GPS coordinates are currently unacquired. Turn on mesh relay location coordinates to plan route paths.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Draw evacuation path overlays and compute best detours dynamically bypassing active threat blocks in the grid.
                    </p>

                    <div className="space-y-2 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                      {/* From Coordinates */}
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5 font-mono">📍 Evacuation Origin (You)</span>
                        <div className="text-[11px] font-mono text-zinc-300">
                          My Location GPS: {currentUserLocation.lat.toFixed(4)}°N, {currentUserLocation.lng.toFixed(4)}°E
                        </div>
                      </div>

                      {/* To Destination */}
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 font-mono">🎯 Target Refuge Hub</span>
                        <select
                          value={routingDestinationId}
                          onChange={(e) => setRoutingDestinationId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[11px] text-zinc-300"
                        >
                          <option value="">-- Choose active hub points --</option>
                          {markers.filter(m => m.type !== 'danger').map(m => (
                            <option key={m.id} value={m.id}>
                              {m.type.toUpperCase()}: {m.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Routing Type Selection */}
                      <div className="pt-2 border-t border-zinc-900 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRoutingSafetyBypass('safest')}
                          className={`py-1 text-[10px] font-bold tracking-wider rounded font-mono uppercase cursor-pointer text-center ${
                            routingSafetyBypass === 'safest' 
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40' 
                              : 'bg-zinc-900 text-zinc-500 border border-transparent hover:text-zinc-300'
                          }`}
                        >
                          🛡️ Bypasses Threats
                        </button>
                        <button
                          onClick={() => setRoutingSafetyBypass('shortest')}
                          className={`py-1 text-[10px] font-bold tracking-wider rounded font-mono uppercase cursor-pointer text-center ${
                            routingSafetyBypass === 'shortest' 
                              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-800/40' 
                              : 'bg-zinc-900 text-zinc-500 border border-transparent hover:text-zinc-300'
                          }`}
                        >
                          ⚡ Direct Line
                        </button>
                      </div>
                    </div>

                    {/* Path results metrics readout card */}
                    {activeRouting && (
                      <div className="p-3 rounded-lg bg-[#0F1D1A]/50 border border-emerald-950 text-emerald-400 space-y-2">
                        <div className="flex items-center justify-between font-mono text-xs font-bold">
                          <span>PATHFINDER ACQUIRED</span>
                          <span className="text-white text-sm bg-emerald-600/30 px-2 py-0.5 rounded">
                            ~{activeRouting.length} KM
                          </span>
                        </div>

                        {activeRouting.bended ? (
                          <div className="text-[10px] text-amber-400 font-medium">
                            ⚠️ Detour generated to bypass the high risk active zone "<strong>{activeRouting.bypassedThreatTitle}</strong>" in intervening sectors.
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            ✓ Evacuation path verified. No hazardous perimeters intersect this primary transit link vector.
                          </div>
                        )}

                        <div className="text-[10.5px] text-zinc-300 font-sans border-t border-emerald-900/40 pt-2 space-y-1">
                          <strong className="block text-[9.5px] uppercase tracking-wider text-emerald-500 font-mono">Offline Instruction Route:</strong>
                          <div>1. Turn into the nearest secure transit street corridors.</div>
                          {activeRouting.bended && (
                            <div className="text-amber-400">2. Execute lateral bypass routing around hazard zone boundaries.</div>
                          )}
                          <div>
                            {activeRouting.bended ? '3.' : '2.'} Drive slowly toward target node label "<strong>{activeRouting.targetMarker.title}</strong>".
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Add New Pin Overlay Dialog Form */}
      {showAddForm && (
        <div id="map-add-pin-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold tracking-widest text-zinc-100 uppercase font-mono">🚨 Report Grid Hazard Spot</h4>
              <button 
                id="close-add-pin-modal-btn"
                onClick={() => setShowAddForm(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMarkerFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 capitalize mb-1 font-mono">Target Type</label>
                  <select
                    id="add-pin-type-select"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MarkerType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300"
                  >
                    <option value="danger">⚠️ Hazard/Threat</option>
                    <option value="shelter">🏠 Safe Shelter</option>
                    <option value="hospital">🏥 Field Hospital</option>
                    <option value="food">🍞 Supply Spot</option>
                    <option value="invincibility">⚡ Point of Care</option>
                    <option value="missing_person">👤 Missing Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 capitalize mb-1 font-mono">Reporter Role</label>
                  <div className="bg-zinc-950 border border-zinc-800 text-zinc-500 rounded px-2.5 py-1.5 font-mono uppercase text-[10px]">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 font-mono">Grid Coordinates</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] text-zinc-650 block mb-0.5 font-mono">LATITUDE</span>
                    <input
                      id="add-pin-lat-input"
                      type="number"
                      step="0.0001"
                      value={newLat}
                      onChange={(e) => setNewLat(Number(e.target.value))}
                      placeholder="Latitude"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[8px] text-zinc-650 block mb-0.5 font-mono">LONGITUDE</span>
                    <input
                      id="add-pin-lng-input"
                      type="number"
                      step="0.0001"
                      value={newLng}
                      onChange={(e) => setNewLng(Number(e.target.value))}
                      placeholder="Longitude"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-350 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 font-mono">Title / Label</label>
                <input
                  id="add-pin-title-input"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Debris on Bridge, Blocked sector..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 font-mono">Description / Intel Info</label>
                <textarea
                  id="add-pin-desc-input"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide precise conditions, sizing, item supply counts, physical cloth descriptions..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 text-zinc-300"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  id="cancel-add-pin-btn"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 px-3 py-1.5 rounded font-mono font-bold hover:text-zinc-200 cursor-pointer text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-pin-btn"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-4 py-1.5 rounded cursor-pointer transition-colors animate-pulse"
                >
                  Submit Pin Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
