'use client';

import { useSyncExternalStore } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

interface CityMarker {
  name: string;
  coords: [number, number];
  size: 'lg' | 'md' | 'sm';
}

const cities: CityMarker[] = [
  { name: 'Stockholm', coords: [18.07, 59.33], size: 'lg' },
  { name: 'Göteborg', coords: [11.97, 57.71], size: 'md' },
  { name: 'Jönköping', coords: [14.16, 57.78], size: 'sm' },
  { name: 'Malmö', coords: [13.0, 55.6], size: 'sm' },
  { name: 'Uppsala', coords: [17.64, 59.86], size: 'sm' },
  { name: 'Örebro', coords: [15.21, 59.27], size: 'sm' },
];

/* All city-to-city connections */
const connections: [number, number][] = [
  [0, 4], // Stockholm - Uppsala
  [0, 5], // Stockholm - Örebro
  [0, 2], // Stockholm - Jönköping
  [5, 1], // Örebro - Göteborg
  [1, 2], // Göteborg - Jönköping
  [2, 3], // Jönköping - Malmö
  [4, 5], // Uppsala - Örebro
  [1, 3], // Göteborg - Malmö
];

const dotSize = { lg: 4.5, md: 3.5, sm: 2.75 };

/* Rendered on the inverted ink panel. Cartographic, not decorative:
   a landmass, hairline routes, and precise markers — no glow stacks. */
const c = {
  fill: '#332D1E',
  stroke: '#E8A81766',
  line: '#E8A81759',
  ring: '#E8A81773',
  dot: '#E8A817',
  text: '#FBFAF7',
  textMuted: '#FBFAF799',
};

const emptySubscribe = () => () => {};

export function NetworkIllustration() {
  /* d3-geo's floating-point path output differs between Node and the
     browser, so the map must render client-side only to avoid a
     hydration mismatch. */
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div className="relative w-full max-w-md mx-auto aspect-4/5">
      {mounted && (
        <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [15, 59.5],
          scale: 2800,
        }}
        width={400}
        height={500}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => geo.properties.name === 'Sweden')
              .map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={1}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: c.fill },
                    pressed: { outline: 'none', fill: c.fill },
                  }}
                />
              ))
          }
        </Geographies>

        {/* City-to-city connection lines */}
        {connections.map(([from, to], i) => (
          <Line
            key={`line-${i}`}
            from={cities[from].coords}
            to={cities[to].coords}
            stroke={c.line}
            strokeWidth={1}
            strokeDasharray="3 5"
            strokeLinecap="round"
          />
        ))}

        {/* City markers */}
        {cities.map((city, i) => {
          const r = dotSize[city.size];
          return (
            <Marker key={`city-${i}`} coordinates={city.coords}>
              <circle r={r * 2.2} fill="none" stroke={c.ring} strokeWidth={0.75} />
              <circle r={r} fill={c.dot} />
              <text
                textAnchor="middle"
                y={r + 15}
                style={{
                  fontSize: city.size === 'lg' ? 12 : city.size === 'md' ? 10.5 : 9.5,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontWeight: 500,
                  letterSpacing: city.size === 'lg' ? 0.2 : 0.1,
                  fill: city.size === 'sm' ? c.textMuted : c.text,
                }}
              >
                {city.name}
              </text>
            </Marker>
          );
        })}
        </ComposableMap>
      )}
    </div>
  );
}
