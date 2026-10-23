import React from 'react';
import './DiscoveryMap.css';

const connections = {
  moon: [
    { icon: '🌌', label: 'Space', detail: 'Look up at the night sky' },
    { icon: '🌊', label: 'Tides', detail: 'The Moon helps move ocean water' },
    { icon: '🚀', label: 'Exploration', detail: 'People have visited the Moon' },
  ],
  space: [
    { icon: '🌙', label: 'Moon', detail: 'A bright neighbour in space' },
    { icon: '⭐', label: 'Stars', detail: 'Distant glowing suns' },
    { icon: '🚀', label: 'Exploration', detail: 'People and robots travel far' },
  ],
  tides: [
    { icon: '🌊', label: 'Ocean', detail: 'Water moves around our planet' },
    { icon: '🌙', label: 'Moon', detail: 'The Moon helps move ocean water' },
    { icon: '🏖️', label: 'Shore', detail: 'Where land and water meet' },
  ],
  exploration: [
    { icon: '🚀', label: 'Rocket', detail: 'A vehicle for reaching space' },
    { icon: '🌙', label: 'Moon', detail: 'A world people have visited' },
    { icon: '🧑‍🚀', label: 'Astronauts', detail: 'People who explore space' },
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
  water: [
    { icon: '🌧️', label: 'Rain', detail: 'Water falls from clouds' },
    { icon: '🌊', label: 'Ocean', detail: 'A huge home for water life' },
    { icon: '🌈', label: 'Rainbow', detail: 'Water drops can reveal colours' },
  ],
  light: [
    { icon: '☀️', label: 'Sun', detail: 'Our brightest natural light' },
    { icon: '🎨', label: 'Colours', detail: 'Light helps us see colours' },
    { icon: '🌈', label: 'Rainbow', detail: 'Rain drops spread light apart' },
  ],
  weather: [
    { icon: '🌧️', label: 'Rain', detail: 'Water drops fall from clouds' },
    { icon: '☀️', label: 'Sunshine', detail: 'Warm light from the Sun' },
    { icon: '💨', label: 'Wind', detail: 'Moving air around us' },
  ],
  rain: [
    { icon: '☁️', label: 'Clouds', detail: 'Rain begins in clouds' },
    { icon: '🌱', label: 'Plants', detail: 'Rain helps plants grow' },
    { icon: '🌈', label: 'Rainbow', detail: 'Sunlight and rain can make colours' },
  ],
  sunshine: [
    { icon: '☀️', label: 'Sun', detail: 'The star closest to Earth' },
    { icon: '🌱', label: 'Plants', detail: 'Plants use light to grow' },
    { icon: '🌈', label: 'Rainbow', detail: 'Light can spread into colours' },
  ],
  wind: [
    { icon: '💨', label: 'Air', detail: 'Wind is moving air' },
    { icon: '🌬️', label: 'Weather', detail: 'Wind is part of changing weather' },
    { icon: '🪁', label: 'Kites', detail: 'Wind can make kites fly' },
  ],
  clouds: [
    { icon: '💧', label: 'Water', detail: 'Clouds are made of tiny drops' },
    { icon: '🌧️', label: 'Rain', detail: 'Drops can fall from clouds' },
    { icon: '🌬️', label: 'Wind', detail: 'Wind moves clouds across the sky' },
  ],
  plants: [
    { icon: '🌱', label: 'Seeds', detail: 'New plants can grow from seeds' },
    { icon: '☀️', label: 'Sunshine', detail: 'Plants use light to grow' },
    { icon: '💧', label: 'Water', detail: 'Plants need water to live' },
  ],
  sun: [
    { icon: '⭐', label: 'Stars', detail: 'The Sun is a nearby star' },
    { icon: '💡', label: 'Light', detail: 'The Sun gives us light' },
    { icon: '🔥', label: 'Heat', detail: 'The Sun warms our planet' },
  ],
  stars: [
    { icon: '🌌', label: 'Space', detail: 'Stars shine across space' },
    { icon: '☀️', label: 'Sun', detail: 'Our Sun is a star' },
    { icon: '🔭', label: 'Telescope', detail: 'A tool for looking far away' },
  ],
  air: [
    { icon: '💨', label: 'Wind', detail: 'Wind is moving air' },
    { icon: '🫁', label: 'Breathing', detail: 'People and animals use air' },
    { icon: '☁️', label: 'Clouds', detail: 'Air helps clouds move' },
  ],
  ocean: [
    { icon: '🐠', label: 'Animals', detail: 'Many animals live in the ocean' },
    { icon: '🌊', label: 'Waves', detail: 'Wind can move ocean water' },
    { icon: '🧂', label: 'Salt', detail: 'Ocean water contains salt' },
  ],
  waves: [
    { icon: '💨', label: 'Wind', detail: 'Wind can make waves grow' },
    { icon: '🌊', label: 'Ocean', detail: 'Waves travel across the ocean' },
    { icon: '🏖️', label: 'Shore', detail: 'Waves reach the shore' },
  ],
  fossils: [
    { icon: '🦴', label: 'Bones', detail: 'Bones can leave fossil clues' },
    { icon: '🪨', label: 'Rocks', detail: 'Fossils are found in rock' },
    { icon: '⏳', label: 'History', detail: 'Fossils tell stories from long ago' },
  ],
  heat: [
    { icon: '🔥', label: 'Fire', detail: 'Fire gives off heat and light' },
    { icon: '☀️', label: 'Sun', detail: 'The Sun warms our planet' },
    { icon: '🌋', label: 'Volcano', detail: 'Volcanoes are hot inside' },
  ],
  rocks: [
    { icon: '🪨', label: 'Minerals', detail: 'Rocks are made from minerals' },
    { icon: '🌋', label: 'Volcano', detail: 'Lava can cool into rock' },
    { icon: '🦴', label: 'Fossils', detail: 'Some rocks hold ancient clues' },
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
  const startingTopic = objectName || 'your next discovery';
  const [topicTrail, setTopicTrail] = React.useState([startingTopic]);
  const activeTopic = topicTrail[topicTrail.length - 1];
  const title = activeTopic;
  const related = connections[slugify(activeTopic)] || fallbackConnections;

  const selectTopic = (label) => {
    if (label === activeTopic || topicTrail.length >= 4) return;
    setTopicTrail((currentTrail) => [...currentTrail, label]);
  };

  const resetMap = () => {
    setTopicTrail([startingTopic]);
    onReset?.();
  };

  const goBack = () => {
    setTopicTrail((currentTrail) => (
      currentTrail.length > 1 ? currentTrail.slice(0, -1) : currentTrail
    ));
  };

  return (
    <section className="discovery-map" aria-labelledby="discovery-map-heading">
      <div className="discovery-map-heading">
        <div>
          <span className="eyebrow">Your learning trail</span>
          <h2 id="discovery-map-heading">Discovery Map</h2>
          <p>Every wonder can lead to another question.</p>
        </div>
        <div className="map-heading-actions">
          <span className="map-stage">Stage {topicTrail.length} of 4</span>
          <span className="map-orbit" aria-hidden="true">✦</span>
        </div>
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
          <button
            type="button"
            className={`map-node map-node-${index + 1}`}
            key={item.label}
            onClick={() => selectTopic(item.label)}
            aria-label={`Open ${item.label} learning connection`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </button>
        ))}
      </div>

      <div className="discovery-map-footer">
        <span>🌱 Stage {topicTrail.length}: {topicTrail.join(' → ')}</span>
        <div className="map-footer-actions">
          {topicTrail.length > 1 && (
            <button type="button" className="map-back-button" onClick={goBack}>
              ← Back
            </button>
          )}
          {(onReset || topicTrail.length > 1) && (
            <button type="button" className="map-reset-button" onClick={resetMap}>
              Start a new trail
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
