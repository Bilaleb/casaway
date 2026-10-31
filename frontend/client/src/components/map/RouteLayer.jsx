import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { TRANSIT_LINES } from '../../data/depots.js';

/**
 * Transit trajectory layer between the primary depots.
 *
 * Each line is rendered as a single `<Polyline />` so panning/zooming
 * stays smooth. Visibility is driven by `hiddenLines`, which the legend
 * and sidebar can toggle independently.
 */
export default function RouteLayer({ hiddenLines = new Set(), lineColor }) {
  const lines = useMemo(() => {
    return TRANSIT_LINES.map((line) => {
      const isHidden = hiddenLines.has(line.id);
      return {
        ...line,
        visible: !isHidden,
        color: lineColor?.(line) ?? (line.colorLight ?? line.color),
      };
    });
  }, [hiddenLines, lineColor]);

  return (
    <>
      {lines.map((line) =>
        line.visible ? (
          <Polyline
            key={line.id}
            positions={line.path}
            pathOptions={{
              color: line.color,
              weight: 4,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ) : null,
      )}
    </>
  );
}
