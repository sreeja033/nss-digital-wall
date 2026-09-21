import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Problem } from '../../types';
import { MapPin, Navigation, Compass, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface InteractiveProblemMapProps {
  problems: Problem[];
  selectedProblemId: string | null;
  onSelectProblem: (id: string | null) => void;
  onNavigateToDetail: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Default central coordinates for NSS Civic District (CMRIT / Medchal / Hyderabad region)
export const DEFAULT_MAP_CENTER = {
  lat: 17.6033,
  lng: 78.4870,
};

export const NSS_OFFICE_LOCATION = {
  lat: 17.6055,
  lng: 78.4885,
  name: 'NSS Volunteer Office & Cadre HQ',
};

// Generates a deterministic coordinate offset for problems that don't have GPS coordinates yet
function getProblemCoordinates(problem: Problem, index: number): [number, number] {
  if (problem.coordinates && problem.coordinates.lat && problem.coordinates.lng) {
    return [problem.coordinates.lat, problem.coordinates.lng];
  }

  // Deterministic scatter around center so existing records appear on real neighborhood streets
  let hash = 0;
  for (let i = 0; i < problem.id.length; i++) {
    hash = (hash << 5) - hash + problem.id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash + index * 37);
  const latOffset = ((absHash % 160) - 80) * 0.00028;
  const lngOffset = ((((absHash >> 3) * 7) % 160) - 80) * 0.00032;

  return [DEFAULT_MAP_CENTER.lat + latOffset, DEFAULT_MAP_CENTER.lng + lngOffset];
}

export const InteractiveProblemMap: React.FC<InteractiveProblemMapProps> = ({
  problems,
  selectedProblemId,
  onSelectProblem,
  onNavigateToDetail,
  userLocation,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [activeUserLoc, setActiveUserLoc] = useState<{ lat: number; lng: number } | null>(() => {
    if (userLocation) return userLocation;
    try {
      const saved = localStorage.getItem('nss_user_detected_location');
      if (saved) return JSON.parse(saved);
      const area = localStorage.getItem('nss_user_area_location');
      if (area) {
        const parsed = JSON.parse(area);
        if (parsed.lat && parsed.lng) return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {}
    return null;
  });
  const [isLocating, setIsLocating] = useState(false);

  // Global callback bridge for popup buttons
  useEffect(() => {
    (window as any).__nss_view_problem_detail = (id: string) => {
      onNavigateToDetail(id);
    };
    (window as any).__nss_select_problem = (id: string) => {
      onSelectProblem(id);
    };

    return () => {
      delete (window as any).__nss_view_problem_detail;
      delete (window as any).__nss_select_problem;
    };
  }, [onNavigateToDetail, onSelectProblem]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = activeUserLoc
      ? [activeUserLoc.lat, activeUserLoc.lng]
      : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap Standard Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Marker Layer Group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // NSS Volunteer Office Fixed Marker
    const nssOfficeIcon = L.divIcon({
      className: 'nss-office-icon-wrapper',
      html: `
        <div style="transform: translate(-50%, -100%);" class="cursor-pointer group flex flex-col items-center select-none">
          <div style="background-color: #1B4B43; border: 2px solid #FFFDF8;" class="px-2 py-0.5 rounded-full text-white text-[11px] font-black shadow-lg flex items-center gap-1">
            <span style="color: #FCBB4A;">★</span>
            <span style="letter-spacing: 0.02em; white-space: nowrap;">NSS Volunteer Office</span>
          </div>
          <div style="width: 2px; height: 10px; background-color: #1B4B43;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #1B4B43; border: 1px solid white;"></div>
        </div>
      `,
      iconSize: [160, 36],
      iconAnchor: [80, 36],
    });

    const officeMarker = L.marker([NSS_OFFICE_LOCATION.lat, NSS_OFFICE_LOCATION.lng], {
      icon: nssOfficeIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    officeMarker.bindPopup(`
      <div style="font-family: var(--font-sans); padding: 4px; max-width: 220px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="background-color: #B8EADE; color: #1B4B43; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Reference HQ</span>
        </div>
        <h4 style="font-weight: 800; color: #1F1B17; font-size: 13px; margin: 0 0 4px 0;">NSS Volunteer Cadre Headquarters</h4>
        <p style="font-size: 11px; color: #57423C; margin: 0;">Coordinating civic problem reporting, task verification, and rapid volunteer dispatch.</p>
      </div>
    `);

    // Invalidate size on load and container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Problem Markers when problems or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const coordinatesList: [number, number][] = [];

    problems.forEach((problem, index) => {
      const [lat, lng] = getProblemCoordinates(problem, index);
      coordinatesList.push([lat, lng]);

      const isSelected = selectedProblemId === problem.id;

      // Status Colors matching Ink-Stamp styling
      let pinColor = '#A03818'; // Reported (Rust)
      let pinBorder = '#842504';
      let statusBg = '#FFDBD1';
      let statusText = '#842504';
      let statusLabel = 'REPORTED';

      if (problem.status === 'IN_PROGRESS') {
        pinColor = '#E8A93A'; // In Progress (Mustard)
        pinBorder = '#7B5300';
        statusBg = '#FFDDAE';
        statusText = '#7B5300';
        statusLabel = 'IN PROGRESS';
      } else if (problem.status === 'SOLVED') {
        pinColor = '#1B4B43'; // Solved (Teal)
        pinBorder = '#0E2E29';
        statusBg = '#B8EADE';
        statusText = '#1B4B43';
        statusLabel = 'SOLVED';
      }

      const pinSize = isSelected ? 30 : 24;
      const shadowSize = isSelected ? 16 : 12;

      // Clean HTML Pushpin icon
      const pinHtml = `
        <div style="position: relative; width: ${pinSize}px; height: ${pinSize}px; transform: translate(-50%, -50%); cursor: pointer; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35)); transition: transform 0.2s;">
          <!-- Pin Shadow -->
          <div style="position: absolute; bottom: -2px; right: -2px; width: ${shadowSize}px; height: ${shadowSize}px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px);"></div>
          <!-- Pin Head -->
          <div style="width: ${pinSize}px; height: ${pinSize}px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffffff 0%, ${pinColor} 55%, ${pinBorder} 100%); border: 1.5px solid ${isSelected ? '#1F1B17' : 'rgba(0,0,0,0.25)'}; box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), ${isSelected ? '0 0 0 3px #1F1B17' : 'none'}; display: flex; align-items: center; justify-content: center; position: relative;">
            <!-- Specular Glint -->
            <span style="position: absolute; top: 18%; left: 22%; width: 26%; height: 26%; background: rgba(255,255,255,0.9); border-radius: 50%;"></span>
            ${problem.urgent ? '<span style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; background: #DC2626; border: 1.5px solid white; border-radius: 50%; box-shadow: 0 0 4px #DC2626;"></span>' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'problem-pushpin-icon',
        html: pinHtml,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize / 2],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      // Interactive Popup with Thumbnail & Action
      const photoHtml = problem.photoUrl
        ? `<div style="width: 100%; height: 90px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; border: 1px solid #DEC0B8; background: #FAF6ED;">
             <img src="${problem.photoUrl}" alt="${problem.title}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" />
           </div>`
        : '';

      const popupContent = `
        <div style="font-family: var(--font-sans); min-width: 200px; max-width: 240px; padding: 2px;">
          ${photoHtml}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="background-color: ${statusBg}; color: ${statusText}; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.04em;">
              ${statusLabel}
            </span>
            <span style="font-size: 10px; color: #57423C; font-weight: 600;">
              ${problem.category}
            </span>
          </div>
          <h4 style="font-family: var(--font-display, serif); font-weight: 800; color: #1F1B17; font-size: 13px; line-height: 1.3; margin: 0 0 4px 0;">
            ${problem.title}
          </h4>
          <p style="font-size: 11px; color: #57423C; margin: 0 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            📍 ${problem.location || 'Local street'}
          </p>
          <div style="display: flex; gap: 6px;">
            <button
              onclick="window.__nss_view_problem_detail('${problem.id}')"
              style="flex: 1; background-color: #A03818; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 4px rgba(160,56,24,0.3);"
            >
              <span>View Details</span>
              <span>→</span>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'nss-corkboard-popup',
      });

      marker.on('click', () => {
        onSelectProblem(problem.id);
      });

      markersLayer.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Auto-fit bounds if problems exist and user hasn't explicitly navigated
    if (coordinatesList.length > 1 && !selectedProblemId) {
      try {
        const bounds = L.latLngBounds(coordinatesList);
        bounds.extend([NSS_OFFICE_LOCATION.lat, NSS_OFFICE_LOCATION.lng]);
        if (activeUserLoc) {
          bounds.extend([activeUserLoc.lat, activeUserLoc.lng]);
        }
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {}
    }
  }, [problems, selectedProblemId, activeUserLoc, onSelectProblem]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!activeUserLoc) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const userIcon = L.divIcon({
      className: 'user-pulse-icon',
      html: `
        <div style="position: relative; width: 22px; height: 22px; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!userMarkerRef.current) {
      const marker = L.marker([activeUserLoc.lat, activeUserLoc.lng], {
        icon: userIcon,
        zIndexOffset: 800,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: var(--font-sans); padding: 4px; font-size: 11px;">
          <strong style="color: #1D4ED8;">📍 Your Detected Location</strong>
          <p style="margin: 2px 0 0 0; color: #4B5563;">Active viewpoint on the NSS Community Map</p>
        </div>
      `);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng([activeUserLoc.lat, activeUserLoc.lng]);
    }
  }, [activeUserLoc]);

  // Handle "Locate Me" GPS trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = { lat, lng };
        setActiveUserLoc(loc);
        try {
          localStorage.setItem('nss_user_detected_location', JSON.stringify(loc));
        } catch {}

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Map GPS location error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Center on NSS Office
  const handleCenterOffice = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([NSS_OFFICE_LOCATION.lat, NSS_OFFICE_LOCATION.lng], 16, {
        duration: 1.0,
      });
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 border-[#C1B296] shadow-inner bg-[#E8DFC9] ${className}`}>
      {/* Real Interactive Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[440px] z-0" />

      {/* Floating Map Controls & Legends */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Center on my location"
          className="w-9 h-9 rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] shadow-md flex items-center justify-center text-[#A03818] hover:bg-[#FFDBD1]/50 active:scale-95 transition-all cursor-pointer"
        >
          {isLocating ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#A03818]" />
          ) : (
            <Navigation className="w-4 h-4 text-[#A03818]" />
          )}
        </button>

        {/* Center NSS Office Button */}
        <button
          type="button"
          onClick={handleCenterOffice}
          title="Center on NSS Volunteer Office"
          className="w-9 h-9 rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] shadow-md flex items-center justify-center text-[#1B4B43] hover:bg-[#B8EADE]/50 active:scale-95 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-[#1B4B43]" />
        </button>
      </div>

      {/* Status Legend Floating Bar */}
      <div className="absolute bottom-2 left-2 sm:left-3 sm:bottom-3 z-10 bg-[#FFFDF8]/95 backdrop-blur-xs border border-[#DEC0B8] rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-2.5 text-[11px] font-bold text-[#1F1B17] max-w-[calc(100%-110px)] sm:max-w-none overflow-x-auto scrollbar-none">
        <span className="text-[#7C695E] text-[10px] uppercase tracking-wider hidden sm:inline">Legend:</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A03818] border border-[#842504]" />
          <span>Reported</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E8A93A] border border-[#7B5300]" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B4B43] border border-[#0E2E29]" />
          <span>Solved</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[#1B4B43]">★</span>
          <span className="text-[10px] text-[#1B4B43]">NSS HQ</span>
        </div>
      </div>
    </div>
  );
};
