  import { useEffect, useState, useRef, useCallback, useContext, createContext} from 'react';
import Map from 'react-map-gl/mapbox';
import axios from 'axios';
import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import tData from './Datasets/MaltaDistricts.Json';
import FilterSelection from './Components/Filters/FilterSelection';
import TownOverview from './Components/TownOverview';

const OverlayContext = createContext(null);

export default function IndexMap() {


  useEffect(() => {
    // Instantiate layers
    setMapLayers([mapLayers, PollutionRegionlayer, SelectedRegionLayer]);
  },[])

  const [mapActive, setMapActive] = useState(true);
  
  // Holds the map layers of Deck.GL. 
  const [mapLayers, setMapLayers] = useState([])

  // Contains info of all pollutants we will monitor
  const [pollutants, setPollutants] = useState({
    "sO2" : { name: "Sulfur Dioxide - SO2", flag : false, col : "#F5E027"},
    "nO" : { name: "Nitric Oxide - NO", flag : false, col : "#24A3D4"},
    "pM2" : { name: "PM 2.5", flag : false, col : "#24A3D4"},
    "pM10" : { name: "PM 10", flag : false, col : "#24A3D4"},
    "nO2" :{ name: "Nitrogen Dioxide - NO2", flag : false, col : "#24A3D4"},
    "o3" : { name: "Ozone - O3", flag : false, col : "#24A3D4"}
    })

  // Contains info of all diseases we will monitor.
  const [diseases, setDiseases] = useState({
     "Asth" : { name: "Asthma", flag : false, col : "#F5E027"},
     "LungC" :{ name: "Lung Cancer", flag : false, col : "#F5E027"},
     "Pneu" : { name: "Pneumonia", flag : false, col : "#F5E027"}
  })

  // Current town being hovered
  const [hoveredTown, setHovered] = useState(null);

  // Overlay Arguments for town detail upon mouse click for town
  const [overlayArgs, setOverlayArgs] = useState(null);

  // Disease Filter reference
  const diseaseFilter = useRef(null);

  // Main Deck Component ref
  const deckRef = useRef();

  // Pollutant Filter reference
  const pollutantFilter = useRef(null);

  // Filter Box reference
  const filterBox = useRef(null);

  // Town Overlay reference
  const overlay = useRef();

  // Filter Options reference 
  const filterOptions = useRef();

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
 

  // Adjust filters and prepare request URLS
  useEffect(() => {
    if (!pollutants){
      return;
    }

    switch (selectedFilter) {
      case 'pollutantFilter': {
        
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

      case 'diseaseFilter': {setFilterReqBody(diseases) 
        setReqUrl("/getDiseaseVol")
        break;}

      default: break;
    }
  }, [pollutants, diseases])


  //////// BACKEND COMMUNICATION

  // Once user selects filter, execute post request
  useEffect(() => {

    if(reqURL && filterReqBody){
        axios.post(`http://localhost:8000${reqURL}`, filterReqBody)
        .then(res => console.log(res.data))
        .catch(err => console.error('API Error:', err))
    }
    
  }, [selectedFilter, reqURL, filterReqBody])




  //////// EVENT LISTENERS 
 
  const clickEventOverlay = useCallback((e) => {
 
    
    if (overlayArgs != null){ 
 

      if (!(e.target == overlay.current) || !overlay.current.contains(e.target)){
 
        setOverlayArgs(null);
        setMapActive(true);
      }

    }
   }, [overlayArgs])

  // Event listener for filter box on click off click
  const clickEventFilter = useCallback((e) => {
      if (filterOptions.current == null){
        return;
      }
      
      // Check if click is inside filter box options (ignore)
      if(e.target == filterOptions.current || filterOptions.current.contains(e.target)){
        return;
      }

      if (selectedFilter != null) {
 
        if(filterBox.current && !filterBox.current.contains(e.target)){
 
          setFilter(null);

        }
      } 
    
  }, [selectedFilter] )



  // Event Listener Initializer
  useEffect(() => {


    document.addEventListener('click', clickEventFilter)
    // document.addEventListener('click', clickEventOverlay)

    return () => {
        document.removeEventListener('click', clickEventFilter);
        // document.removeEventListener('click', clickEventOverlay);
    }

  }, [clickEventFilter, clickEventOverlay])




  ////////// LAYER VARIABLES & FUNCTIONS

  // Use Effect to re-render polygons with highlighted red if we are hovering over a town
  useEffect(() => {
    if(!hoveredTown){
      setMapLayers([PollutionRegionlayer]);
      return;
    }
 
    // Re-make SelectedRegionLayer
    SelectedRegionLayer = SelectedRegionLayer.clone({
      data: hoveredTown
    })

    setMapLayers([PollutionRegionlayer, SelectedRegionLayer])
    
  }, [hoveredTown])


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


  let SelectedRegionLayer = new PolygonLayer({
    id: "SelectedPolygonLayer",
    data: hoveredTown,
    getPolygon: d => d,
    getLineColor: [255, 255 ,255],
    getFillColor: [179, 2, 64],
    getLineWidth: 10,
    lineWidthMinPixels: 1,
  })

  // Polygon layer to overlay all Maltese town
  const PollutionRegionlayer = new PolygonLayer({
    id: "PolygonLayer",
    data: mData,
    getPolygon : d => d.geometry.coordinates[0][0],
    getLineColor:[255, 255, 255],
    // getFillColor: d => [255, Math.random() * 255 , 50, 120],
    // getFillColor:
    getLineWidth: 10,
    lineWidthMinPixels: 1,

    onClick: (info, event) => {
      if (info.object){
        // If overlay is open, check if click is within overlay bounds
        if (overlayArgs && overlay.current) {
          // Get overlay coordinates
          const rect = overlay.current.getBoundingClientRect();
          // Get click coordinates
          const clickX = info.x;
          const clickY = info.y;
          
          // If click is inside overlay, ignore polygon click
          if (clickX >= rect.left && clickX <= rect.right && 
              clickY >= rect.top && clickY <= rect.bottom) {
            return;
          }
        }

        // Set town overlay args with name, and viewport coordinates
        setOverlayArgs({townName: info.object.properties.plain_name, xPos: Math.floor(info.x), yPos: Math.floor(info.y)})
        setMapActive(false);
      }
    },

    onHover: (info, event) => {
      // If object info exists
      if (info.object && !overlayArgs){
        // console.log(info.index + info.object.properties.locality_n)
        // Highlight town
        setHovered(info.object.geometry.coordinates[0])
      }else{
        return; 
      } 
    },
    pickable: true
  }); 



  return (
    <DeckGL controller={mapActive} ref={deckRef} initialViewState={INITIAL_MAP_STATE}layers={mapLayers}>
      <div ref={filterOptions} className={"map-controls-div"}>
        <div className="map-controls">
          <h2 className="filter-title">Filters</h2>
          <button onClick={() => setFilter('pollutantFilter')} className={selectedFilter == 'pollutantFilter' ? "map-control-btn active" : "map-control-btn"}>Pollutants</button>
          <button onClick={() => setFilter('diseaseFilter')} className={selectedFilter == 'diseaseFilter' ? "map-control-btn active" : "map-control-btn"}>Diseases</button>
          <button className="map-control-btn">Stats Monitor</button>
          <button className="map-control-btn">Borders</button>
        </div>
        <div ref={filterBox} className={selectedFilter ? "filters-content active" : "filters-content"}>
          {selectedFilter == 'pollutantFilter' ? <FilterSelection useRef={pollutantFilter} data={pollutants} setData={setPollutants} /> : null}
          {selectedFilter == 'diseaseFilter' ? <FilterSelection useRef={diseaseFilter} data={diseases} setData={setDiseases} /> : null}
        </div>
      </div>


      {overlayArgs != null ? <TownOverview overlayRef={overlay} args={overlayArgs} setArgs={setOverlayArgs} setMapActive={setMapActive}/> : null}
      
      <Map
        
        id="MainMap"
        mapStyle="mapbox://styles/ohayorino/cmet1zrt8002r01sc8rfq2fw2"
        mapboxAccessToken={MapAccessToken}
      />
    </DeckGL>
  );
}
