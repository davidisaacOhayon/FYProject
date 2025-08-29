import { useEffect } from 'react';
import Map from 'react-map-gl/mapbox';

import DeckGL, { ContourLayer } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/data.json';

export default function IndexMap() {
  const MapAccessToken =
    'pk.eyJ1Ijoib2hheW9yaW5vIiwiYSI6ImNtZXN1bjd4ODA4d2QyanM4aTBiNm9zN2gifQ.JAp21RU5bHyH5Y0xzdOZvQ';

  const INITIAL_MAP_STATE = {
    latitude: 35.9375,
    longitude: 14.3754,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  };

  const layer = new ContourLayer({
    id: 'contour-layer',
    data: mData,
    getPosition: (d) => d.Coordinates, 
    pickable: true,
    aggregation: 'MAX',
    contours: [
      { threshold: 1, color: [255, 0, 0], strokeWidth: 2, zIndex: 1 },
      { threshold: [3, 10], color: [55, 0, 55], zIndex: 0 },
      { threshold: 5, color: [0, 255, 0], strokeWidth: 6, zIndex: 2 },
      { threshold: 15, color: [0, 0, 255], strokeWidth: 4, zIndex: 3 },
    ],
    cellSize: 60000,
  });

  useEffect(() => {
    mData.forEach((e) => console.log(e.Coordinates));
  }, []);

  return (
    <DeckGL initialViewState={INITIAL_MAP_STATE} controller={true} layers={[layer]}>
      <div className="map-controls">
        <button className="map-control-btn">Filters</button>
        <button className="map-control-btn">Pollutants</button>
        <button className="map-control-btn">Borders</button>
      </div>

      <Map
        id="MainMap"
        mapStyle="mapbox://styles/ohayorino/cmet1zrt8002r01sc8rfq2fw2"
        mapboxAccessToken={MapAccessToken}
      />
    </DeckGL>
  );
}
