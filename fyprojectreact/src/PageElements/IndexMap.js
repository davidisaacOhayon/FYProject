import { useEffect, useState } from 'react';
import Map from 'react-map-gl/mapbox';

import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import tData from './Datasets/MaltaDistricts.Json';


export default function IndexMap() {
 

  const [mapLayers, setMapLayers] = useState([]);

  const MapAccessToken = 'pk.eyJ1Ijoib2hheW9yaW5vIiwiYSI6ImNtZXN1bjd4ODA4d2QyanM4aTBiNm9zN2gifQ.JAp21RU5bHyH5Y0xzdOZvQ';

  const INITIAL_MAP_STATE = {
    latitude: 35.9375,
    longitude: 14.3754,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  };


  // Text layers to display all Maltese district names
  const DistrictLayer = new TextLayer({
    id: 'TextLayer',
    data: tData,
    getPosition: d => d.coordinates,
    getText: d => d.name,
    getColor: [255, 255, 255],
    getSize: 16

  });
  // Polygon layer to display all Maltese districts
  const PollutionRegionlayer = new PolygonLayer({
    id: "PolygonLayer",
    data: mData,
    getPolygon : d => d.geometry.coordinates[0][0],
    getLineColor: [255, 255, 255],
    getFillColor: d => [255, Math.random() * 255 , 50, 120],
    getLineWidth: 20,
    lineWidthMinPixels: 1,
    pickable: true
  });

  const EnablePollutionLayer = () => {  
    if(!mapLayers.includes(PollutionRegionlayer)){
        mapLayers.push(PollutionRegionlayer);
    }else {
      // I hate JS so much wtf
      mapLayers.splice( mapLayers.indexOf(PollutionRegionlayer) ,1)
    }
  }

  return (
    <DeckGL initialViewState={INITIAL_MAP_STATE} controller={true} layers={[PollutionRegionlayer, DistrictLayer]}>
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
