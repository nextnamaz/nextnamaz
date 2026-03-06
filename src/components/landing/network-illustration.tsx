'use client';

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

const dotSize = { lg: 8, md: 6, sm: 4 };

const c = {
  fill: '#FDF4DC',
  stroke: '#E8A81730',
  line: '#E8A81740',
  glow1: '#E8A81714',
  glow3: '#E8A81733',
  dot: '#E8A817',
  pulse: '#E8A81750',
  text: '#1A1A1A',
  textMuted: '#78716C',
};

export function NetworkIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
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
            strokeWidth={1.5}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        ))}

        {/* City markers */}
        {cities.map((city, i) => {
          const r = dotSize[city.size];
          return (
            <Marker key={`city-${i}`} coordinates={city.coords}>
              <circle r={r * 2.5} fill={c.glow1} />
              <circle r={r} fill={c.glow3} />
              <circle r={r * 0.5} fill={c.dot} />
              {city.size === 'lg' && (
                <circle r={r} fill="none" stroke={c.pulse} strokeWidth={0.8}>
                  <animate attributeName="r" from={String(r)} to={String(r * 3)} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                textAnchor="middle"
                y={r + 14}
                style={{
                  fontSize: city.size === 'lg' ? 13 : city.size === 'md' ? 11 : 10,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontWeight: city.size === 'lg' ? 600 : 500,
                  fill: city.size === 'sm' ? c.textMuted : c.text,
                }}
              >
                {city.name}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
