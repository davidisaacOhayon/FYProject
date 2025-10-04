import { useEffect, useState, useRef } from 'react';
import Map from 'react-map-gl/mapbox';

import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import tData from './Datasets/MaltaDistricts.Json';
import FilterSelection from './Components/Filters/FilterSelection';

export default function IndexMap() {
 

  const [mapLayers, setMapLayers] = useState([])

  const [pollutants, setPollutants] = useState([
    { name: "Sulfur Dioxide", flag : false, col : "#F5E027"},
    { name: "Nitrogen Dioxide", flag : false, col : "#24A3D4"},
    { name: "Nitrogen Dioxide", flag : false, col : "#24A3D4"},
    { name: "Nitrogen Dioxide", flag : false, col : "#24A3D4"},
    { name: "Nitrogen Dioxide", flag : false, col : "#24A3D4"},
    { name: "Nitrogen Dioxide", flag : false, col : "#24A3D4"}
  ])

  const [diseases, setDiseases] = useState([
      { name: "Asthma", flag : false, col : "#F5E027"},
      { name: "Lung Cancer", flag : false, col : "#F5E027"},
      { name: "Pneumonia", flag : false, col : "#F5E027"}

  ])

  // Disease Filter reference
  const diseaseFilter = useRef(null);
  // Pollutant Filter reference
  const pollutantFilter = useRef(null);

  const filterBox = useRef(null);

 

  const [selectedFilter, setFilter] = useState(null);

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
    // getFillColor: d => [255, Math.random() * 255 , 50, 120],
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


  // Function for setting filter.
  const selectFilter = (filter) => {
    setFilter(filter);
  }


  useEffect(() => {
    const clickEvent = (e) => {
      if(filterBox.current && !filterBox.current.contains(e.target)){
        console.log("not in place buddy")
        // setFilter(null);
      }
    }  
  
    document.addEventListener('click', clickEvent)

    return () => document.removeEventListener('click', clickEvent)
  }, [])


  return (
    <DeckGL initialViewState={INITIAL_MAP_STATE} controller={true} layers={[PollutionRegionlayer]}>
      <div className={"map-controls-div"}>
        <div className="map-controls">
          <h2 className="filter-title">Filters</h2>
          <button  onClick={(e) => selectFilter(pollutantFilter)} className={selectedFilter == pollutantFilter ? "map-control-btn active" : "map-control-btn"}>Pollutants</button>
          <button onClick={(e) => selectFilter(diseaseFilter)} className={selectedFilter == diseaseFilter ? "map-control-btn active" : "map-control-btn"}>Diseases</button>
          <button className="map-control-btn">Stats Monitor</button>
          <button className="map-control-btn">Borders</button>
        </div>
        <div ref={filterBox} className={selectedFilter ? "filters-content active" : "filters-content"}>
          {selectedFilter == pollutantFilter ? <FilterSelection data={pollutants} setData={setPollutants} /> : null}
          {selectedFilter == diseaseFilter ? <FilterSelection data={diseases} setData={setDiseases} /> : null}
        </div>
      </div>


      <Map
        id="MainMap"
        mapStyle="mapbox://styles/ohayorino/cmet1zrt8002r01sc8rfq2fw2"
        mapboxAccessToken={MapAccessToken}
      />
    </DeckGL>
  );
}
