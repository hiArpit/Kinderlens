import { useState } from 'react';
import './KnowledgeGraph.css';

const MAX_OVERVIEW_NODES = 12;
const MAX_OVERVIEW_LINKS = 10;
const LINKS_PER_PAGE = 8;

function shorten(value = '', maxLength = 15) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatIdea(value = '') {
  return value ? `${value[0].toLocaleUpperCase()}${value.slice(1)}` : '';
}

function getOverviewPositions(count) {
  if (count === 1) return [{ x: 400, y: 155 }];
  const firstAngle = -Math.PI / 2 + Math.PI / count;
  return Array.from({ length: count }, (_, index) => {
    const angle = firstAngle + (index * Math.PI * 2) / count;
    return { x: 400 + Math.cos(angle) * 286, y: 155 + Math.sin(angle) * 102 };
  });
}

function getFocusPositions(count) {
  if (count === 1) return [{ x: 400, y: 155 }];
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return { x: 400, y: 155 };
    const neighborIndex = index - 1;
    const neighborCount = count - 1;
    const angle = -Math.PI / 2 + (neighborIndex * Math.PI * 2) / neighborCount;
    return { x: 400 + Math.cos(angle) * 260, y: 155 + Math.sin(angle) * 92 };
  });
}

function ConnectionCard({ edge }) {
  return (
    <li>
      <strong>{edge.from} <span aria-hidden="true">and</span> {edge.to}</strong>
      <small className="knowledge-graph-idea">Shared idea: {formatIdea(edge.sharedIdea)}</small>
      <div className="knowledge-graph-evidence">
        <p><b>{edge.from}:</b> {edge.fromFact}</p>
        <p><b>{edge.to}:</b> {edge.toFact}</p>
      </div>
    </li>
  );
}

export default function KnowledgeGraph({
  discoveries = [],
  edges = [],
  focusedObject = null,
  totalConnections = 0,
  page = 1,
  pageCount = 1,
  loading = false,
  hasError = false,
  onFocusChange = () => {},
  emptyMessage,
}) {
  const [showAllOverviewLinks, setShowAllOverviewLinks] = useState(false);
  const [focusName, setFocusName] = useState(focusedObject || '');
  const [focusPage, setFocusPage] = useState(page || 1);
  const focusEntry = discoveries.find((item) => item.objectName.toLowerCase() === focusName.toLowerCase());
  const isFocused = Boolean(focusName && focusEntry);
  const focusDataReady = isFocused
    && focusedObject?.toLowerCase() === focusName.toLowerCase()
    && page === focusPage;
  const overviewDataReady = !isFocused && !focusedObject;
  const graphDataReady = isFocused ? focusDataReady : overviewDataReady;
  const overviewDiscoveries = discoveries.slice(0, MAX_OVERVIEW_NODES);
  const focusEdges = focusDataReady
    ? edges.filter((edge) => edge.from.toLowerCase() === focusName.toLowerCase()
      || edge.to.toLowerCase() === focusName.toLowerCase())
    : [];
  const visibleDiscoveries = isFocused
    ? [focusEntry, ...(focusDataReady ? focusEdges : []).map((edge) => (edge.from.toLowerCase() === focusName.toLowerCase() ? edge.to : edge.from))
      .map((name) => discoveries.find((item) => item.objectName.toLowerCase() === name.toLowerCase()))
      .filter((item) => item && item.objectName.toLowerCase() !== focusName.toLowerCase())]
    : overviewDiscoveries;
  const positions = isFocused
    ? getFocusPositions(visibleDiscoveries.length)
    : getOverviewPositions(visibleDiscoveries.length);
  const positionByName = new Map(visibleDiscoveries.map((item, index) => [
    item.objectName.toLowerCase(), positions[index],
  ]));
  const visibleEdges = (graphDataReady ? (isFocused ? focusEdges : edges) : []).filter((edge) => (
    positionByName.has(edge.from.toLowerCase()) && positionByName.has(edge.to.toLowerCase())
  ));
  const overviewLinks = isFocused ? visibleEdges : visibleEdges.slice(0, MAX_OVERVIEW_LINKS);
  const displayedLinks = isFocused || showAllOverviewLinks ? overviewLinks : overviewLinks.slice(0, 4);

  const handleFocusChange = (event) => {
    const nextFocus = event.target.value;
    setFocusName(nextFocus);
    setFocusPage(1);
    setShowAllOverviewLinks(false);
    onFocusChange(nextFocus, 1);
  };

  const changeFocusPage = (nextPage) => {
    setFocusPage(nextPage);
    onFocusChange(focusName, nextPage);
  };

  return (
    <section className="knowledge-graph" aria-labelledby="knowledge-graph-heading">
      <div className="knowledge-graph-heading">
        <div>
          <h4 id="knowledge-graph-heading">Your learning graph</h4>
          <p>{isFocused ? `Explore what connects ${focusEntry.objectName} to other discoveries.` : 'Choose an object to explore its connections.'}</p>
        </div>
        {discoveries.length > 0 && <span>{discoveries.length} {discoveries.length === 1 ? 'object' : 'objects'}</span>}
      </div>

      {discoveries.length > 1 && (
        <div className="knowledge-graph-controls">
          <label htmlFor="knowledge-graph-focus">Focus on an object</label>
          <select id="knowledge-graph-focus" value={focusName} onChange={handleFocusChange}>
            <option value="">Overview - recent objects</option>
            {discoveries.map((item) => (
              <option key={`${item.objectName}-${item.createdAt || ''}`} value={item.objectName}>
                {item.objectName}
              </option>
            ))}
          </select>
        </div>
      )}

      {visibleDiscoveries.length === 0 ? (
        <p className="knowledge-graph-empty">{emptyMessage || 'Your captured objects will appear here as you explore.'}</p>
      ) : (
        <div className="knowledge-graph-canvas-wrap">
          <svg className="knowledge-graph-canvas" viewBox="0 0 800 310" role="img" aria-labelledby="knowledge-graph-title knowledge-graph-description">
          <title id="knowledge-graph-title">Captured object knowledge graph</title>
          <desc id="knowledge-graph-description">
            {isFocused
              ? focusDataReady
                ? `${focusEntry.objectName} has ${totalConnections} connected discoveries. Showing ${visibleEdges.length} connections on this page.`
                : `Loading connections for ${focusEntry.objectName}.`
              : `Showing ${visibleDiscoveries.length} recent objects and their strongest connections.`}
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
                <title>{edge.fromFact} {edge.toFact}</title>
              </line>
            );
          })}
          {visibleDiscoveries.map((item, index) => {
            const { x, y } = positions[index];
            const isFocus = isFocused && item.objectName.toLowerCase() === focusName.toLowerCase();
            return (
              <g className={`knowledge-graph-node${isFocus ? ' is-focus' : ''}`} key={`${item.objectName}-${index}`}>
                <title>{item.objectName}</title>
                <rect x={x - 59} y={y - 23} width="118" height="46" rx="14" />
                <text x={x} y={y + 5}>{shorten(item.objectName)}</text>
              </g>
            );
          })}
          </svg>
        </div>
      )}

      {isFocused && !focusDataReady && !hasError && (
        <p className="knowledge-graph-status" role="status">Loading connections...</p>
      )}
      {!isFocused && !overviewDataReady && !hasError && (
        <p className="knowledge-graph-status" role="status">Updating overview...</p>
      )}
      {displayedLinks.length > 0 && (
        <ul className="knowledge-graph-links" aria-label="Why discoveries are connected">
          {displayedLinks.map((edge) => <ConnectionCard key={`${edge.from}-${edge.to}`} edge={edge} />)}
        </ul>
      )}

      {!isFocused && visibleEdges.length > 4 && (
        <button
          type="button"
          className="knowledge-graph-text-button"
          onClick={() => setShowAllOverviewLinks((shown) => !shown)}
        >
          {showAllOverviewLinks ? 'Show fewer connections' : `Show all ${Math.min(visibleEdges.length, MAX_OVERVIEW_LINKS)} overview connections`}
        </button>
      )}

      {isFocused && focusDataReady && totalConnections > LINKS_PER_PAGE && (
        <div className="knowledge-graph-pagination" aria-label="Connection pages">
          <span>Showing {((page - 1) * LINKS_PER_PAGE) + 1}-{Math.min(page * LINKS_PER_PAGE, totalConnections)} of {totalConnections}</span>
          <button type="button" onClick={() => changeFocusPage(focusPage - 1)} disabled={focusPage <= 1}>Previous</button>
          <button type="button" onClick={() => changeFocusPage(focusPage + 1)} disabled={focusPage >= pageCount}>Next</button>
        </div>
      )}

      {!isFocused && discoveries.length > MAX_OVERVIEW_NODES && (
        <p className="knowledge-graph-more-note">Showing the 12 most recent objects. Choose any object above to explore its connections.</p>
      )}
      {!graphDataReady && hasError && (
        <p className="knowledge-graph-no-edges" role="status">The graph could not update. Choose an object to try again.</p>
      )}
      {graphDataReady && visibleDiscoveries.length > 1 && visibleEdges.length === 0 && (
        <p className="knowledge-graph-no-edges">No clear shared ideas have been found for these objects yet.</p>
      )}
      {isFocused && focusDataReady && visibleEdges.length === 0 && (
        <p className="knowledge-graph-no-edges">There are no clear connections for {focusEntry.objectName} yet.</p>
      )}
    </section>
  );
}
