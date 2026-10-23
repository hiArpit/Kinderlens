import React from 'react';
import './DiscoveryMap.css';

const connections = {
  moon: [
    { icon: '🌌', label: 'Space', detail: 'Look up at the night sky' },
    { icon: '🌊', label: 'Tides', detail: 'The Moon helps move ocean water' },
    { icon: '🚀', label: 'Exploration', detail: 'People have visited the Moon' },
  ],
  dinosaur: [
    { icon: '🦴', label: 'Fossils', detail: 'Clues from long ago' },
    { icon: '🌋', label: 'Earth', detail: 'A changing home for life' },
    { icon: '🦕', label: 'Animals', detail: 'Many kinds of living things' },
  ],
  rainbow: [
    { icon: '💧', label: 'Water', detail: 'Tiny drops split the light' },
    { icon: '☀️', label: 'Light', detail: 'Sunlight has many colours' },
    { icon: '🌦️', label: 'Weather', detail: 'Rain and sunshine meet' },
  ],
  volcano: [
    { icon: '🌋', label: 'Earth', detail: 'Our planet is always changing' },
    { icon: '🔥', label: 'Heat', detail: 'Deep inside Earth is very hot' },
    { icon: '🪨', label: 'Rocks', detail: 'Lava cools into new rock' },
  ],
};

const fallbackConnections = [
  { icon: '🔎', label: 'Observe', detail: 'Look closely at its shape and colour' },
  { icon: '📚', label: 'Learn', detail: 'Read a simple, trusted explanation' },
  { icon: '✨', label: 'Wonder', detail: 'Ask a new question about it' },
];

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function DiscoveryMap({ objectName = '', onReset }) {
  const title = objectName || 'your next discovery';
  const related = connections[slugify(objectName)] || fallbackConnections;

  return (
    <section className="discovery-map" aria-labelledby="discovery-map-heading">
      <div className="discovery-map-heading">
        <div>
          <span className="eyebrow">Your learning trail</span>
          <h2 id="discovery-map-heading">Discovery Map</h2>
          <p>Every wonder can lead to another question.</p>
        </div>
        <span className="map-orbit" aria-hidden="true">✦</span>
      </div>

      <div className="map-canvas" aria-label={`Learning connections for ${title}`}>
        <span className="map-line map-line-one" aria-hidden="true" />
        <span className="map-line map-line-two" aria-hidden="true" />
        <span className="map-line map-line-three" aria-hidden="true" />
        <div className="map-node map-node-center">
          <span aria-hidden="true">🔍</span>
          <strong>{title}</strong>
          <small>Start here</small>
        </div>
        {related.map((item, index) => (
          <div className={`map-node map-node-${index + 1}`} key={item.label}>
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>

      <div className="discovery-map-footer">
        <span>🌱 Keep exploring to grow your map</span>
        {onReset && (
          <button type="button" className="map-reset-button" onClick={onReset}>
            Find something new
          </button>
        )}
      </div>
    </section>
  );
}
