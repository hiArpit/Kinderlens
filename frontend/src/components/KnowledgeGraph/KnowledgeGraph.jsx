import './KnowledgeGraph.css';

const MAX_GRAPH_NODES = 12;

function shorten(value = '', maxLength = 15) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function getNodePositions(count) {
  if (count === 1) return [{ x: 400, y: 155 }];
  const firstAngle = -Math.PI / 2 + Math.PI / count;
  return Array.from({ length: count }, (_, index) => {
    const angle = firstAngle + (index * Math.PI * 2) / count;
    return { x: 400 + Math.cos(angle) * 286, y: 155 + Math.sin(angle) * 102 };
  });
}

export default function KnowledgeGraph({ discoveries = [], edges = [], emptyMessage }) {
  const visibleDiscoveries = discoveries.slice(0, MAX_GRAPH_NODES);
  const positions = getNodePositions(visibleDiscoveries.length);
  const positionByName = new Map(visibleDiscoveries.map((item, index) => [
    item.objectName.toLowerCase(), positions[index],
  ]));
  const visibleEdges = edges.filter((edge) => (
    positionByName.has(edge.from.toLowerCase()) && positionByName.has(edge.to.toLowerCase())
  ));

  return (
    <section className="knowledge-graph" aria-labelledby="knowledge-graph-heading">
      <div className="knowledge-graph-heading">
        <div>
          <h4 id="knowledge-graph-heading">Your learning graph</h4>
          <p>Past discoveries connect when their saved explanations share a word.</p>
        </div>
        {discoveries.length > 0 && <span>{discoveries.length} {discoveries.length === 1 ? 'object' : 'objects'}</span>}
      </div>

      {visibleDiscoveries.length === 0 ? (
        <p className="knowledge-graph-empty">{emptyMessage || 'Your captured objects will appear here as you explore.'}</p>
      ) : (
        <svg className="knowledge-graph-canvas" viewBox="0 0 800 310" role="img" aria-labelledby="knowledge-graph-title knowledge-graph-description">
          <title id="knowledge-graph-title">Captured object knowledge graph</title>
          <desc id="knowledge-graph-description">
            {visibleDiscoveries.length} captured objects and {visibleEdges.length} links based on shared words in their saved explanations.
          </desc>
          {visibleEdges.map((edge) => {
            const from = positionByName.get(edge.from.toLowerCase());
            const to = positionByName.get(edge.to.toLowerCase());
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className="knowledge-graph-edge"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              >
                <title>{edge.detail}</title>
              </line>
            );
          })}
          {visibleDiscoveries.map((item, index) => {
            const { x, y } = positions[index];
            return (
              <g className="knowledge-graph-node" key={`${item.objectName}-${index}`}>
                <title>{item.objectName}</title>
                <rect x={x - 59} y={y - 23} width="118" height="46" rx="14" />
                <text x={x} y={y + 5}>{shorten(item.objectName)}</text>
              </g>
            );
          })}
        </svg>
      )}

      {visibleEdges.length > 0 && (
        <ul className="knowledge-graph-links" aria-label="Why discoveries are connected">
          {visibleEdges.map((edge) => (
            <li key={`${edge.from}-${edge.to}`}>
              <strong>{edge.from} <span aria-hidden="true">↔</span> {edge.to}</strong>
              <small>{edge.detail}</small>
            </li>
          ))}
        </ul>
      )}

      {discoveries.length > MAX_GRAPH_NODES && (
        <div className="knowledge-graph-more" aria-label="More captured objects">
          <strong>More past discoveries</strong>
          <p>{discoveries.slice(MAX_GRAPH_NODES).map((item) => item.objectName).join(' · ')}</p>
        </div>
      )}
      {visibleDiscoveries.length > 1 && visibleEdges.length === 0 && (
        <p className="knowledge-graph-no-edges">Your past discoveries are shown above. No shared words have been found between them yet.</p>
      )}
    </section>
  );
}
