import { useEffect, useState, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import axios from 'axios';
import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import tData from './Datasets/MaltaDistricts.Json';
import FilterSelection from './Components/Filters/FilterSelection';

export default function IndexMap() {
 

  // Holds the map layers of Deck.GL. 
  const [mapLayers, setMapLayers] = useState([])

  // Contains info of all pollutants we will monitor
  const [pollutants, setPollutants] = useState({
    "sO2" : { name: "Sulfur Dioxide (SO2)", flag : false, col : "#F5E027"},
    "nO" : { name: "Nitric Oxide (nO)", flag : false, col : "#24A3D4"},
    "pM2" : { name: "PM2", flag : false, col : "#24A3D4"},
    "pM10" : { name: "PM10", flag : false, col : "#24A3D4"},
    "nO2" :{ name: "Nitrogen Dioxide (nO2)", flag : false, col : "#24A3D4"},
    "o3" : { name: "Ozone (O3)", flag : false, col : "#24A3D4"}
    })

  // Contains info of all diseases we will monitor.
  const [diseases, setDiseases] = useState({
     "Asth" : { name: "Asthma", flag : false, col : "#F5E027"},
     "LungC" :{ name: "Lung Cancer", flag : false, col : "#F5E027"},
     "Pneu" : { name: "Pneumonia", flag : false, col : "#F5E027"}
  })


  // Disease Filter reference
  const diseaseFilter = useRef(null);
  // Pollutant Filter reference
  const pollutantFilter = useRef(null);

  const filterBox = useRef(null);

  // Keeps track of selected filters
  const [selectedFilter, setFilter] = useState(null);

  // Filter request body. Changes upon filter selection
  const [filterReqBody, setFilterReqBody] = useState(null);

  // Request URL. Changes upon filter selection
  const [reqURL, setReqUrl] = useState(null)

  // Map Access Token
  const MapAccessToken = 'pk.eyJ1Ijoib2hheW9yaW5vIiwiYSI6ImNtZXN1bjd4ODA4d2QyanM4aTBiNm9zN2gifQ.JAp21RU5bHyH5Y0xzdOZvQ';

  // Definining map to display first Malta
  const INITIAL_MAP_STATE = {
    latitude: 35.9375,
    longitude: 14.3754,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  };



  //////// LOGIC FUNCTIONS
  // Function for setting filter.
  const selectFilter = (filter) => {
    setFilter(filter);
    
  }

  useEffect(() => {
    if (!pollutants){
      return;
    }

    switch (selectedFilter) {
      case pollutantFilter: {
        
        setFilterReqBody(
        {
          "nO" : pollutants["nO"].flag,
          "sO2" : pollutants["sO2"].flag,
          "pM2" : pollutants["pM2"].flag,
          "pM10" : pollutants["pM10"].flag,
          "nO2" : pollutants["nO2"].flag,
          "o3" : pollutants["o3"].flag
        }
      ) 
        setReqUrl("/getPollutantVol/")
        break;}

      case diseaseFilter: {setFilterReqBody(diseases) 
        setReqUrl("/getDiseaseVol")
        break;}

      default: break;
    }
  }, [pollutants, diseases])


  //////// BACKEND COMMUNICATION

  // Once user selects filter, execute post request
  useEffect(() => {

    console.log(`Pollutant changes:`)
    if(reqURL && filterReqBody){
        axios.post(`http://localhost:8000${reqURL}`, filterReqBody)
        .then(res => console.log(res.data))
    }

  }, [selectFilter])



  //////// EVENT LISTENERS 

  // Assign event listener
  useEffect(() => {
      const clickEvent = (e) => {
        if (selectedFilter) {
          if(filterBox.current && !filterBox.current.contains(e.target)){
            setFilter(null);
          }
        }
      }  
    document.addEventListener('click', clickEvent)

    return () => document.removeEventListener('click', clickEvent)
  }, [])


  ////////// LAYER VARIABLES & FUNCTIONS
  const EnablePollutionLayer = () => {  
    if(!mapLayers.includes(PollutionRegionlayer)){
        mapLayers.push(PollutionRegionlayer);
    }else {
      mapLayers.splice( mapLayers.indexOf(PollutionRegionlayer) ,1)
    }
  }

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
