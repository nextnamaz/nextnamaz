'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/** OpenFreeMap's light style: free, no key, OpenStreetMap data. Recoloured below. */
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Apple-like colours for the style's layers: warm land, soft water, green parks, white roads. */
const PAINT: Record<string, Record<string, string>> = {
  background: { 'background-color': '#F4F1EA' },
  water: { 'fill-color': '#A9D7F2' },
  waterway: { 'line-color': '#A9D7F2' },
  park: { 'fill-color': '#CDE8C0' },
  landcover_wood: { 'fill-color': '#D5EBC8' },
  landuse_residential: { 'fill-color': '#EEEAE1' },
  building: { 'fill-color': '#E6E1D7' },
  highway_minor: { 'line-color': '#FFFFFF' },
  highway_path: { 'line-color': '#FFFFFF' },
  highway_major_casing: { 'line-color': '#E3DCCB' },
  highway_major_inner: { 'line-color': '#FFFFFF' },
  highway_major_subtle: { 'line-color': '#FFFFFF' },
  highway_motorway_casing: { 'line-color': '#E8C77A' },
  highway_motorway_inner: { 'line-color': '#FBE3A1' },
  highway_motorway_subtle: { 'line-color': '#FBE3A1' },
};

/** The pin, drawn as a DOM marker so it can drop and ripple. */
function pinElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'mv-pin';
  el.innerHTML =
    '<span class="mv-ripple"></span>' +
    '<svg viewBox="-16 -44 32 46" width="36" height="52" aria-hidden="true">' +
    '<path d="M0 0 C-4 -10 -14 -16 -14 -28 A14 14 0 0 1 14 -28 C14 -16 4 -10 0 0 Z" fill="#E8A817" stroke="#B87A08" stroke-width="1.5"/>' +
    '<circle cx="0" cy="-28" r="5.5" fill="#fff"/></svg>';
  return el;
}

const PIN_CSS = `
.mv-pin { position: relative; width: 36px; height: 52px; }
.mv-pin svg { position: absolute; inset: 0; filter: drop-shadow(0 4px 6px rgba(38,24,10,0.3)); }
.mv-ripple { position: absolute; left: 50%; bottom: 0; width: 22px; height: 9px; margin-left: -11px; border-radius: 50%; background: #E8A817; opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .mv-pin svg { animation: mv-drop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .mv-ripple { animation: mv-ripple 2.2s cubic-bezier(0.16, 1, 0.3, 1) 500ms infinite; }
}
@keyframes mv-drop { from { transform: translateY(-18px); opacity: 0; } }
@keyframes mv-ripple { from { transform: scale(0.4); opacity: 0.6; } to { transform: scale(3); opacity: 0; } }
.mv-map .maplibregl-ctrl-attrib { font-size: 10px; background: rgba(255,255,255,0.8); border-radius: 6px; }
`;

interface MapViewProps {
  lat: number;
  lon: number;
  zoom: number;
  /** Drop a pin on the centre; without it the map is only a backdrop. */
  pinned: boolean;
}

/**
 * A real, sharp vector map of the place (MapLibre drawing OpenFreeMap's
 * OpenStreetMap tiles), recoloured to sit on the page like a phone's own map.
 * It flies to each new place rather than jumping, and the pin drops in there.
 * Looked at, not handled: dragging and zooming are off.
 */
export function MapView({ lat, lon, zoom, pinned }: MapViewProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const MarkerClass = useRef<typeof Marker | null>(null);
  const target = useRef({ lat, lon, zoom, pinned });

  // Create the map once; the library loads only when this step is shown.
  useEffect(() => {
    let alive = true;
    void import('maplibre-gl').then(({ Map, Marker }) => {
      if (!alive || !box.current) return;
      const t = target.current;
      const m = new Map({
        container: box.current,
        style: STYLE,
        center: [t.lon, t.lat],
        zoom: t.zoom,
        interactive: false,
        attributionControl: { compact: true },
      });
      m.on('style.load', () => {
        for (const [layer, paint] of Object.entries(PAINT)) {
          if (!m.getLayer(layer)) continue;
          for (const [prop, value] of Object.entries(paint)) m.setPaintProperty(layer, prop, value);
        }
      });
      // The credits fold into their (i) button, as on a phone's map; a tap opens them.
      m.on('load', () => m.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
      map.current = m;
      MarkerClass.current = Marker;
      if (t.pinned) marker.current = new Marker({ element: pinElement(), anchor: 'bottom' }).setLngLat([t.lon, t.lat]).addTo(m);
    });
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Glide to each new place, and move the pin there once it lands.
  useEffect(() => {
    target.current = { lat, lon, zoom, pinned };
    const m = map.current;
    if (!m) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    marker.current?.remove();
    m.flyTo({ center: [lon, lat], zoom, duration: reduced ? 0 : 1600, essential: false });
    if (!pinned) return;
    const drop = () => {
      // A fresh element, so the drop plays again.
      if (MarkerClass.current) marker.current = new MarkerClass.current({ element: pinElement(), anchor: 'bottom' }).setLngLat([lon, lat]).addTo(m);
    };
    m.once('moveend', drop);
    return () => {
      m.off('moveend', drop);
    };
  }, [lat, lon, zoom, pinned]);

  return (
    <div className="mv-map relative h-36 overflow-hidden min-[400px]:h-44 sm:h-52 rounded-3xl border border-border bg-[#F4F1EA]">
      <style>{PIN_CSS}</style>
      {/* Sized by height, not by absolute insets: the library's own CSS sets position: relative on it. */}
      <div ref={box} className="h-full w-full" aria-hidden />
    </div>
  );
}
