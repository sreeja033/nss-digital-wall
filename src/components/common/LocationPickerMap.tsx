import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER } from './InteractiveProblemMap';
import { Navigation, MapPin } from 'lucide-react';

interface LocationPickerMapProps {
  coordinates: { lat: number; lng: number } | null;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  coordinates,
  onLocationChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = coordinates?.lat ?? DEFAULT_MAP_CENTER.lat;
    const initialLng = coordinates?.lng ?? DEFAULT_MAP_CENTER.lng;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap Standard Free Tiles with required attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Draggable Rust Pushpin Marker
    const pinHtml = `
      <div style="position: relative; width: 28px; height: 28px; transform: translate(-50%, -50%); cursor: grab; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffffff 0%, #A03818 55%, #842504 100%); border: 2px solid #FFFDF8; box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), 0 0 0 2px rgba(160,56,24,0.4); display: flex; align-items: center; justify-content: center; position: relative;">
          <span style="position: absolute; top: 18%; left: 22%; width: 26%; height: 26%; background: rgba(255,255,255,0.9); border-radius: 50%;"></span>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'picker-pushpin-icon',
      html: pinHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.bindTooltip('Drag or click to adjust location', {
      permanent: false,
      direction: 'top',
      offset: [0, -14],
    });

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange({ lat: pos.lat, lng: pos.lng });
    });

    // Click anywhere on map to drop / move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    markerRef.current = marker;
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync marker position if coordinates change externally (e.g. from GPS auto-detect)
  useEffect(() => {
    if (!coordinates || !mapRef.current || !markerRef.current) return;
    const current = markerRef.current.getLatLng();
    if (
      Math.abs(current.lat - coordinates.lat) > 0.00005 ||
      Math.abs(current.lng - coordinates.lng) > 0.00005
    ) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapRef.current.panTo([coordinates.lat, coordinates.lng], { animate: true });
    }
  }, [coordinates]);

  const handleCenterOnMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
        }
        onLocationChange({ lat, lng });
      },
      (err) => {
        console.warn('Center on me failed:', err);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#DEC0B8] bg-[#FAF6ED] ${className}`}>
      <div ref={containerRef} className="w-full h-48 sm:h-56 z-0" />

      {/* Floating Center on GPS Button */}
      <button
        type="button"
        onClick={handleCenterOnMe}
        title="Snap map to my location"
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-[#FFFDF8] border border-[#DEC0B8] shadow-sm flex items-center justify-center text-[#A03818] hover:bg-[#FFDBD1]/50 active:scale-95 transition-all cursor-pointer"
      >
        <Navigation className="w-3.5 h-3.5 text-[#A03818]" />
      </button>

      {/* Mini Helper Overlay */}
      <div className="absolute bottom-1.5 left-2 z-10 bg-[#FFFDF8]/90 backdrop-blur-xs border border-[#DEC0B8] rounded-md px-2 py-0.5 text-[10px] font-bold text-[#57423C] flex items-center gap-1 shadow-xs">
        <MapPin className="w-2.5 h-2.5 text-[#A03818]" />
        <span>Click or drag pin on map</span>
      </div>
    </div>
  );
};
