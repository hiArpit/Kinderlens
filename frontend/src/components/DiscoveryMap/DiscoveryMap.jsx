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
  animals: [
    { icon: '🦁', label: 'Habitats', detail: 'Places where animals live' },
    { icon: '🍎', label: 'Food', detail: 'What animals need to grow' },
    { icon: '🐾', label: 'Mammals', detail: 'Animals that feed babies milk' },
  ],
  habitats: [
    { icon: '🌳', label: 'Forest', detail: 'A leafy home for many animals' },
    { icon: '🌊', label: 'Ocean', detail: 'A watery home for sea life' },
    { icon: '🏜️', label: 'Desert', detail: 'A dry home with little rain' },
  ],
  food: [
    { icon: '🌿', label: 'Plants', detail: 'Food made by growing things' },
    { icon: '🐛', label: 'Insects', detail: 'Small animals in many food chains' },
    { icon: '🦷', label: 'Teeth', detail: 'Teeth help animals eat' },
  ],
  mammals: [
    { icon: '🍼', label: 'Babies', detail: 'Mammal babies drink milk' },
    { icon: '🫁', label: 'Breathing', detail: 'Mammals breathe air' },
    { icon: '🦴', label: 'Bones', detail: 'A skeleton supports the body' },
  ],
  forest: [
    { icon: '🌳', label: 'Trees', detail: 'Trees make a forest home' },
    { icon: '🦉', label: 'Birds', detail: 'Birds build homes in branches' },
    { icon: '🐾', label: 'Tracks', detail: 'Footprints reveal animal visitors' },
  ],
  desert: [
    { icon: '🌵', label: 'Cactus', detail: 'Plants that save water' },
    { icon: '🐪', label: 'Camels', detail: 'Animals adapted to dry places' },
    { icon: '🌙', label: 'Night', detail: 'Some desert animals come out at night' },
  ],
  insects: [
    { icon: '🐝', label: 'Bees', detail: 'Helpful pollinators' },
    { icon: '🦋', label: 'Butterflies', detail: 'Insects with colourful wings' },
    { icon: '🐜', label: 'Ants', detail: 'Tiny insects that work together' },
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
  earth: [
    { icon: '🌍', label: 'Planet', detail: 'Earth is our home in space' },
    { icon: '🌋', label: 'Volcano', detail: 'Openings can release hot rock' },
    { icon: '🪨', label: 'Rocks', detail: 'Earth is covered with rocks and soil' },
  ],
  planet: [
    { icon: '🌍', label: 'Earth', detail: 'A planet with air and life' },
    { icon: '🌙', label: 'Moon', detail: 'A natural neighbour of Earth' },
    { icon: '☀️', label: 'Sun', detail: 'Our star gives Earth light' },
  ],
  fossils: [
    { icon: '🦴', label: 'Bones', detail: 'Bones can leave fossil clues' },
    { icon: '🪨', label: 'Rocks', detail: 'Fossils are found in rock' },
    { icon: '⏳', label: 'History', detail: 'Fossils tell stories from long ago' },
  ],
  history: [
    { icon: '⏳', label: 'Time', detail: 'History helps us learn from the past' },
    { icon: '🏛️', label: 'Civilizations', detail: 'People built communities long ago' },
    { icon: '🗺️', label: 'Archaeology', detail: 'Clues help us understand the past' },
  ],
  pyramid: [
    { icon: '🏛️', label: 'History', detail: 'A clue from an ancient time' },
    { icon: '🧱', label: 'Building', detail: 'Large stones can form structures' },
    { icon: '🗺️', label: 'Egypt', detail: 'Pyramids were built in Egypt' },
  ],
  building: [
    { icon: '🧱', label: 'Materials', detail: 'Buildings use many materials' },
    { icon: '📐', label: 'Shapes', detail: 'Shapes help structures stay strong' },
    { icon: '🏛️', label: 'Architecture', detail: 'The art of designing buildings' },
  ],
  materials: [
    { icon: '🪨', label: 'Stone', detail: 'A strong natural building material' },
    { icon: '🪵', label: 'Wood', detail: 'A useful material from trees' },
    { icon: '🧱', label: 'Bricks', detail: 'Small blocks can build walls' },
  ],
  shapes: [
    { icon: '🔺', label: 'Triangles', detail: 'Strong shapes with three sides' },
    { icon: '⚪', label: 'Circles', detail: 'Shapes with no corners' },
    { icon: '⬛', label: 'Squares', detail: 'Shapes with four equal sides' },
  ],
  architecture: [
    { icon: '🏠', label: 'Homes', detail: 'Places people design to live in' },
    { icon: '🌉', label: 'Bridges', detail: 'Structures that cross gaps' },
    { icon: '📐', label: 'Shapes', detail: 'Shapes help designers plan' },
  ],
  egypt: [
    { icon: '🏜️', label: 'Desert', detail: 'A dry landscape around the pyramids' },
    { icon: '🌊', label: 'Nile', detail: 'A river that helped people live' },
    { icon: '⏳', label: 'History', detail: 'Clues from an ancient civilization' },
  ],
  beehive: [
    { icon: '🐝', label: 'Bees', detail: 'Busy insects that live together' },
    { icon: '🍯', label: 'Honey', detail: 'Bees make honey from flower nectar' },
    { icon: '⬡', label: 'Honeycomb', detail: 'Wax cells store food and raise babies' },
  ],
  bees: [
    { icon: '🌼', label: 'Flowers', detail: 'Bees visit flowers for nectar' },
    { icon: '🌱', label: 'Pollination', detail: 'Bees help plants make seeds' },
    { icon: '🍯', label: 'Honey', detail: 'Bees make honey for their hive' },
  ],
  honey: [
    { icon: '🌼', label: 'Flowers', detail: 'Nectar begins with flowers' },
    { icon: '🐝', label: 'Bees', detail: 'Bees collect nectar' },
    { icon: '🍯', label: 'Food', detail: 'Honey is a sweet food' },
  ],
  honeycomb: [
    { icon: '⬡', label: 'Hexagons', detail: 'Six-sided shapes fit together' },
    { icon: '🐝', label: 'Bees', detail: 'Bees build honeycomb with wax' },
    { icon: '🍯', label: 'Honey', detail: 'Cells store honey safely' },
  ],
  flowers: [
    { icon: '🌼', label: 'Nectar', detail: 'A sweet drink for pollinators' },
    { icon: '🌱', label: 'Seeds', detail: 'Flowers can make new plants' },
    { icon: '🐝', label: 'Bees', detail: 'Bees visit flowers to collect food' },
  ],
  pollination: [
    { icon: '🌼', label: 'Flowers', detail: 'Flowers make pollen and nectar' },
    { icon: '🐝', label: 'Bees', detail: 'Bees carry pollen between flowers' },
    { icon: '🌱', label: 'Seeds', detail: 'Pollination helps plants make seeds' },
  ],
  telescope: [
    { icon: '🔭', label: 'Science', detail: 'A tool for asking sky questions' },
    { icon: '🌌', label: 'Space', detail: 'A telescope helps us see far away' },
    { icon: '⭐', label: 'Stars', detail: 'Distant lights in the night sky' },
  ],
  science: [
    { icon: '🔍', label: 'Observe', detail: 'Look closely and notice patterns' },
    { icon: '❓', label: 'Questions', detail: 'Curiosity starts an investigation' },
    { icon: '🧪', label: 'Experiments', detail: 'Try a safe way to test an idea' },
  ],
  coral: [
    { icon: '🌊', label: 'Ocean', detail: 'Coral reefs grow in warm seas' },
    { icon: '🐠', label: 'Animals', detail: 'Many sea animals live near reefs' },
    { icon: '🪸', label: 'Reefs', detail: 'Tiny coral animals build big homes' },
  ],
  reefs: [
    { icon: '🐠', label: 'Fish', detail: 'Colourful animals live around reefs' },
    { icon: '🌊', label: 'Ocean', detail: 'Reefs are part of the ocean' },
    { icon: '🛡️', label: 'Protection', detail: 'Reefs shelter many sea animals' },
  ],
  volcano: [
    { icon: '🌋', label: 'Earth', detail: 'Our planet is always changing' },
    { icon: '🔥', label: 'Heat', detail: 'Deep inside Earth is very hot' },
    { icon: '🪨', label: 'Rocks', detail: 'Lava cools into new rock' },
  ],
};

const genericTopicConnections = {
  body: [
    { icon: '👀', label: 'Senses', detail: 'Senses help us notice the world' },
    { icon: '🦴', label: 'Bones', detail: 'Bones support many bodies' },
    { icon: '💪', label: 'Movement', detail: 'Body parts can help living things move' },
  ],
  habitat: [
    { icon: '🌳', label: 'Home', detail: 'A habitat is a living thing’s home' },
    { icon: '🌦️', label: 'Weather', detail: 'Weather changes what habitats are like' },
    { icon: '🍃', label: 'Shelter', detail: 'Shelter helps living things stay safe' },
  ],
  needs: [
    { icon: '💧', label: 'Water', detail: 'Living things need water' },
    { icon: '🥕', label: 'Food', detail: 'Food gives living things energy' },
    { icon: '🏡', label: 'Shelter', detail: 'Shelter provides a safe place to live' },
  ],
  travel: [
    { icon: '🛣️', label: 'Roads', detail: 'Roads help vehicles travel across land' },
    { icon: '🚦', label: 'Traffic', detail: 'Traffic rules help people travel safely' },
    { icon: '🗺️', label: 'Places', detail: 'Travel connects different places' },
  ],
  energy: [
    { icon: '⛽', label: 'Fuel', detail: 'Some vehicles use fuel to move' },
    { icon: '🔋', label: 'Battery', detail: 'Some vehicles use stored electricity' },
    { icon: '🌞', label: 'Power', detail: 'Energy makes movement possible' },
  ],
  growth: [
    { icon: '🌱', label: 'Seeds', detail: 'Many plants begin as seeds' },
    { icon: '🕰️', label: 'Time', detail: 'Growth happens over time' },
    { icon: '🌼', label: 'Changes', detail: 'Living things change as they grow' },
  ],
  life: [
    { icon: '🌎', label: 'Ecosystems', detail: 'Living things share their surroundings' },
    { icon: '🤝', label: 'Connections', detail: 'Living things can help one another' },
    { icon: '🔄', label: 'Cycles', detail: 'Nature has repeating life cycles' },
  ],
  parts: [
    { icon: '🔍', label: 'Shape', detail: 'Notice the lines, edges, and forms' },
    { icon: '📏', label: 'Size', detail: 'Compare how big or small it is' },
    { icon: '⚙️', label: 'Function', detail: 'See how its parts help it work' },
  ],
  materials: [
    { icon: '🪵', label: 'Wood', detail: 'A natural material from trees' },
    { icon: '🔩', label: 'Metal', detail: 'A strong material used in many objects' },
    { icon: '🧴', label: 'Plastic', detail: 'A light material shaped in many ways' },
  ],
  uses: [
    { icon: '🏠', label: 'Home', detail: 'Ways people use it at home' },
    { icon: '🛠️', label: 'Work', detail: 'Ways it can help people work' },
    { icon: '🎲', label: 'Play', detail: 'Ways children can use it safely' },
  ],
  shape: [
    { icon: '🔺', label: 'Patterns', detail: 'Shapes and designs can repeat' },
    { icon: '🎨', label: 'Colours', detail: 'Colours can help us notice details' },
    { icon: '🧩', label: 'Design', detail: 'Design shows how parts fit together' },
  ],
  size: [
    { icon: '📐', label: 'Measure', detail: 'Tools can tell us its size' },
    { icon: '⚖️', label: 'Compare', detail: 'Compare it with familiar objects' },
    { icon: '📦', label: 'Space', detail: 'Objects need space around them' },
  ],
  function: [
    { icon: '🔧', label: 'Tools', detail: 'Tools help people do jobs' },
    { icon: '💡', label: 'Ideas', detail: 'People design things to solve problems' },
    { icon: '🔁', label: 'Change', detail: 'Parts can move or work together' },
  ],
  wood: [
    { icon: '🌳', label: 'Trees', detail: 'Wood comes from trees' },
    { icon: '🪵', label: 'Grain', detail: 'Wood has lines called grain' },
    { icon: '🌱', label: 'Nature', detail: 'Trees are part of living ecosystems' },
  ],
  metal: [
    { icon: '⛏️', label: 'Minerals', detail: 'Metals come from minerals in Earth' },
    { icon: '🔥', label: 'Heat', detail: 'Heat can change the shape of metal' },
    { icon: '♻️', label: 'Recycling', detail: 'Metal can often be used again' },
  ],
  plastic: [
    { icon: '🧪', label: 'Materials', detail: 'Plastic is made from special materials' },
    { icon: '♻️', label: 'Recycling', detail: 'Some plastics can be recycled' },
    { icon: '🌍', label: 'Environment', detail: 'We should use and dispose of it carefully' },
  ],
  home: [
    { icon: '👨‍👩‍👧', label: 'People', detail: 'People use objects in different ways' },
    { icon: '🧹', label: 'Care', detail: 'Taking care of things helps them last' },
    { icon: '🛡️', label: 'Safety', detail: 'Use it safely with a grown-up when needed' },
  ],
  work: [
    { icon: '🎯', label: 'Jobs', detail: 'Objects can help people complete jobs' },
    { icon: '🤝', label: 'Teamwork', detail: 'People can use tools together' },
    { icon: '✅', label: 'Results', detail: 'Tools help turn ideas into results' },
  ],
  play: [
    { icon: '🎲', label: 'Games', detail: 'Games help us learn and have fun' },
    { icon: '🎨', label: 'Creativity', detail: 'Play gives us ways to make new things' },
    { icon: '🛡️', label: 'Safety', detail: 'Safe play keeps everyone happy' },
  ],
};

function capturedObjectConnections(objectName) {
  const name = objectName.toLowerCase();
  if (/(dog|cat|bird|fish|animal|insect|bee|butterfly)/.test(name)) {
    return [
      { icon: '🐾', label: 'Body', detail: `Notice the body parts of the ${objectName}` },
      { icon: '🌿', label: 'Habitat', detail: `Where a ${objectName} can live` },
      { icon: '🍎', label: 'Needs', detail: `What a ${objectName} needs to grow` },
    ];
  }
  if (/(tree|flower|plant|leaf|fruit)/.test(name)) {
    return [
      { icon: '🌱', label: 'Growth', detail: `How the ${objectName} changes over time` },
      { icon: '☀️', label: 'Needs', detail: `What a ${objectName} needs to grow` },
      { icon: '🐝', label: 'Life', detail: `How a ${objectName} connects with living things` },
    ];
  }
  if (/(car|bus|bike|bicycle|train|plane|vehicle|truck)/.test(name)) {
    return [
      { icon: '⚙️', label: 'Parts', detail: `The pieces that help a ${objectName} move` },
      { icon: '🛣️', label: 'Travel', detail: `Where a ${objectName} can take people` },
      { icon: '⚡', label: 'Energy', detail: `What helps a ${objectName} move` },
    ];
  }
  return [
    { icon: '🔍', label: 'Parts', detail: `Look closely at the parts of the ${objectName}` },
    { icon: '🧱', label: 'Materials', detail: `Discover what the ${objectName} is made from` },
    { icon: '🛠️', label: 'Uses', detail: `Find out how people use the ${objectName}` },
  ];
}

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function DiscoveryMap({ objectName = '', onReset }) {
  if (!objectName) {
    return (
      <section className="discovery-map discovery-map-empty" aria-labelledby="discovery-map-heading">
        <div className="discovery-map-heading">
          <div>
            <span className="eyebrow">Your learning trail</span>
            <h2 id="discovery-map-heading">Discovery Map</h2>
            <p>Choose a wonder to build a four-step learning trail.</p>
          </div>
          <span className="map-orbit" aria-hidden="true">✦</span>
        </div>
        <div className="empty-map-message">
          <span aria-hidden="true">🧭</span>
          <div>
            <strong>Your map starts with a question</strong>
            <p>Explore an object and we&apos;ll connect it to related ideas.</p>
          </div>
        </div>
      </section>
    );
  }

  const startingTopic = objectName || 'your next discovery';
  const [topicTrail, setTopicTrail] = React.useState([startingTopic]);
  const activeTopic = topicTrail[topicTrail.length - 1];
  const title = activeTopic;
  const related = connections[slugify(activeTopic)]
    || genericTopicConnections[slugify(activeTopic)]
    || (topicTrail.length === 1 ? capturedObjectConnections(startingTopic) : genericTopicConnections.uses);

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
          <p>Follow one related topic at a time.</p>
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
