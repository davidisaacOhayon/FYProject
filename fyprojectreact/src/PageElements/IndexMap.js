  import { useEffect, useState, useRef, useCallback, useContext, createContext, useMemo} from 'react';
import Map from 'react-map-gl/mapbox';
import axios from 'axios';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import {H3ClusterLayer} from '@deck.gl/geo-layers';
import { ColumnLayer } from '@deck.gl/layers';
import { getTownClusters } from './Components/Backend/Database_connections';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import townPolygons from './Datasets/MaltaRegionsPolygons/TownPolygonInfo.json';
import tData from './Datasets/MaltaDistricts.Json';
import FilterSelection from './Components/Filters/FilterSelection';
import TownOverview from './Components/TownOverview';
import StatisticsDashboard from './StatisticsDashboard';
import { emphasize } from '@mui/material/styles';
import { townsCoordinates } from './Datasets/TownCoordinates';
import { PollutionLevelColorGrade, pollutantLimitsYearly } from './Components/Backend/PollutantConcentrationLimits';
import  Legend  from './Components/Legend.js';

const OverlayContext = createContext(null);
 
export default function IndexMap() {
  


  const [dashboardActive, setDashboardActive] = useState(false);

  ///////////////// LAYER VARIABLES
  const [mapActive, setMapActive] = useState(true);
  
  // Holds the map layers of Deck.GL. 
  const [mapLayers, setMapLayers] = useState([]);

  // Town data for Other town map layers
  const [townLayerData, setLayerData] = useState(null);

  // Town Text Data for text layers
  const [townTextData, setTownTextData] = useState(null);

  // Toggled town layer
  const [townLayerToggled, toggleTownLayer] = useState(false);


  // Current town being hovered
  const [hoveredTown, setHovered] = useState(null);



  ///////////////// ARGUMENT VARIABLES

  // Town Data for legend when hovered. 
  const [legendTown, setLegendTown] = useState(null);

  // Contains info of all pollutants we will monitor
  const [pollutants, setPollutants] = useState({
    "SO2" : { name: "SO2", flag : false},
    "PM25" : { name: "PM 2.5", flag : false},
    "PM10" : { name: "PM 10", flag : false},
    "NO2" :{ name: "NO2"},
    "O3" : { name: "O3", flag : false}
  })
  // Will be used by the pollutant map to retrieve date recording of data
  const [mainDate, setDate] = useState("2023-01-01");

  // Will be used by the pollutant map to trigger annual average recording of data
  const [polAnnum, setPolAnnum] = useState(false);

  // Overlay Arguments for town detail upon mouse click for town
  const [overlayArgs, setOverlayArgs] = useState(null);

  // Pollutant Filter reference
  const pollutantFilter = useRef(null);

  // Main Deck Component ref
  const deckRef = useRef();

  // Filter Box reference
  const filterBox = useRef(null);

  // Town Overlay reference
  const overlay = useRef();

  // Filter Options reference 
  const filterOptions = useRef();

  // Keeps track of selected filters
  const [selectedFilter, setFilter] = useState(null);

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
  
  const formatTownMapData = (heatData) => {
 

    const polKeys = {
      "SO2" : "so_ugm3",
      "PM25" : "pm25_ugm3",
      "PM10" : "pm10_ugm3",
      "NO2" :"no2_ugm3",
      "O3" : "o_ugm3"
    }

    const pol = Object.keys(pollutants).find(key => pollutants[key].flag == true);

    const data = Object.entries(heatData).map(([key, value]) => {
        //  console.log(`Formatting data for ${pol} with key ${polKeys[pol]}`)
         let geo = Object.values(townPolygons).find(feature => feature.properties.plain_name === value.town)?.geometry.coordinates;
        //  console.log(`Retrieved geometry for ${value.town}: ${geo ? "Found" : "Not Found"}`);

      return {
        town: value.town,
        pol: value[polKeys[pol]],
        coordinates: townsCoordinates[value.town] ?? null ,
        geometry: geo
      } 
    })

    

    return data;
  }
  const loadTownMapData = (pol) => { 

    let data;
    const date = mainDate;

  
    console.log(`Running request for ${pol} at ${date}`)

    // Get average pollutant readings for all towns based yearly
    if (polAnnum){
      console.log("Annual average enabled, adjusting request")
      const date = Date.parse("2023-01-01");
      const endDate = Date.parse("2023-12-31");

      axios.get(`/getPollutantAvgTowns?&start_date=${date}&end_date=${endDate}&pollutant=${pol}`)
    }

    // Get pollutant readings for all towns based on date.
    axios.get(`/getTownsReadingsOnDate?&date=${date}`)
    .then(res => { 
      data = res.data;})
    .finally(() => {
      console.log(data);
      let formattedData = formatTownMapData(data);
      console.log(formattedData);
      setLayerData(formattedData);
    })
    .catch(err => console.log(err.message));
  }


  // HOVERED TOWN USE EFFECT HANDLER
  useEffect(() => {
  const layers = [PollutionRegionlayer];


  if (hoveredTown) {
    layers.push(SelectedRegionLayer);
  }

  setMapLayers(layers);
}, [hoveredTown]);

// Use effect to retrieve town app data for town data layers once a pollutant has been selected
  useEffect(() => {

    // Retrieve selected pollutant key
    const selectedPol = Object.keys(pollutants).find(key => pollutants[key].flag == true);

    if (selectedPol ){
      loadTownMapData(selectedPol);
    }
  }, [pollutants, mainDate])


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
  // useEffect(() => {

  //   let layers = [PollutionRegionlayer];

  //   console.log("I should be running");

  //   if (hoveredTown) {
  //     SelectedRegionLayer = SelectedRegionLayer.clone({
  //       data: hoveredTown
  //     });
  //     layers.push(SelectedRegionLayer);
  //   }

  //   if (townLayerToggled){

  //     // Retain column layers if they exist
  //     if (townLayerData && townLayerData.length > 0) {
  //       PollutionLevelLayer = PollutionLevelLayer.clone({
  //         data: townLayerData
  //       });
  //       layers.push(PollutionLevelLayer);
  //     }
  //   }



  //   console.log(`Setting new layers to ${layers.map(layer => layer.id)}`)
  //   // Reset map layers
  //   setMapLayers(layers);

  // }, [hoveredTown, townLayerData, pollutants, townLayerToggled]);

 

  ///////// LAYER VARIABLES 

  // Text layers to display all Maltese district names
  const DistrictLayer = new TextLayer({
    id: 'TextLayer',
    data: tData,
    getPosition: d => d.coordinates,
    getText: d => d.name,
    getColor: [255, 255, 255],
    getSize: 16

  });

  // Used by other layers to display info overhead 
  const InfoTextLayer = new TextLayer({
    id: 'InfoTextLayer',
    data: tData|| [],
    getPosition: d => d.coordinates,
    getText: d => d.name,
    getColor: [255, 255, 255],
    getSize: 16
  });

  let SelectedRegionLayer = useMemo(() => new PolygonLayer({
    id: "SelectedPolygonLayer",
    data: hoveredTown,
    getPolygon: d => d,
    getLineColor: [255, 255 ,255],
    getFillColor: [179, 2, 64],
    getLineWidth: 10,
    lineWidthMinPixels: 1,
  }));

  // Polygon layer to overlay all Maltese town
  let PollutionRegionlayer = useMemo(() => new PolygonLayer({
    id: "PolygonTownLayer",
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
        setOverlayArgs({townName: info.object.properties.plain_name, xPos: Math.floor(info.x), yPos: Math.floor(info.y)});
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
  }));

  // Heat Map Layer for pollutant exposure clusters
  let HeatMapLayerClustered = new HeatmapLayer({
    id: 'HeatmapLayerClustered',
    data: townLayerData || [],
    getPosition: d => [d.coordinates[1], d.coordinates[0]],
    getWeight: d => d.pol || 0,
    radiusPixels: 60,
  });

  // Hexagon Layer for pollutant exposure clusters
  let ColumnPollutantLayer = new ColumnLayer({
  id: 'pollution-columns',
  data: townLayerData || [],

  diskResolution: 20,
  radius: 500, // adjust for Malta scale (500–800 works well)
  extruded: true,
  elevationScale: 100, // controls height intensity

  getPosition: d => [d.coordinates[1], d.coordinates[0]], // must be [lng, lat]
  getElevation: d => d.pol || 0,

  getFillColor: d => {
    const value = d.pol || 0;
    return value > 40
      ? [255, 0, 0]
      : value > 25
      ? [255, 165, 0]
      : [0, 128, 255];
  },
  pickable: true,
  onHover: (info, event) => {
    if (info.object) {
      const { town, pol } = info.object;
      const tooltip = `${town}\n${pol.toFixed(2)} µg/m³ ${info.x}, ${info.y}`;
      // Show tooltip (you can implement your own tooltip logic here)
      console.log(tooltip);
      
    }
  },
});

  // Polygon layer for pollutant exposure levels per town
  let PollutionLevelLayer = useMemo(() => new PolygonLayer({  
    id: "PolygonLevelLayer",
    data: townLayerData,
    getPolygon : d => d.geometry[0][0],
    getLineColor:[255, 255, 255],
    getFillColor: d => PollutionLevelColorGrade(d.pol, pollutantLimitsYearly[Object.keys(pollutants).find(key => pollutants[key].flag == true)]),
    getLineWidth: 10,
    lineWidthMinPixels: 1,
    pickable: false,
    
  }), [townLayerData, pollutants]); 


  let layers = useMemo(() => {

    let baseLayers = [];

    if (PollutionRegionlayer){
      baseLayers.push(PollutionRegionlayer);
    }

    if (hoveredTown) {
      SelectedRegionLayer = SelectedRegionLayer.clone({
        data: hoveredTown
      });
      baseLayers.push(SelectedRegionLayer);
    }

    if (townLayerToggled){

      // Retain column layers if they exist
      if (townLayerData && townLayerData.length > 0) {
        PollutionLevelLayer = PollutionLevelLayer.clone({
          data: townLayerData
        });
        baseLayers.push(PollutionLevelLayer);
      }
    }

    return baseLayers;

  }, [PollutionRegionlayer, hoveredTown, townLayerData, pollutants, townLayerToggled])


  return (
    <>
    <DeckGL controller={mapActive} ref={deckRef} initialViewState={INITIAL_MAP_STATE}layers={layers}>
      <div ref={filterOptions} className={"map-controls-div"}>
        <div className="map-controls">
          <h2 className="filter-title">Controls</h2>
          <button onClick={() => setFilter('pollutantFilter')} className={selectedFilter == 'pollutantFilter' ? "map-control-btn active" : "map-control-btn"}>Pollutants</button>
          <button className="map-control-btn" onClick={ () => setDashboardActive(!dashboardActive)}>Dashboard</button>
        </div>
        <div ref={filterBox} className={selectedFilter ? "filters-content active" : "filters-content"}>
          <h2>Pollution Filter</h2>
          <hr></hr>
          {selectedFilter == 'pollutantFilter' ? <FilterSelection useRef={pollutantFilter} data={pollutants} setData={setPollutants} /> : null}
          <div>
            <h3>Date Selection:</h3>
            <input disabled={polAnnum} type="date" id="date" defaultValue={mainDate} onChange={(e) => {
              setDate(e.target.value)}}></input>
            <label for={"annum"}> Annual Average:
            <input type="checkbox" id="annum" name="annum" onChange={(e) => setPolAnnum(e.target.checked)} ></input>
            </label>
          </div>
            <label for={"pollution"}> Pollution Layer:
              <input placeholder={"Pollution Layer "} type="checkbox" id="pollution" name="pollution" onChange={() => toggleTownLayer(!townLayerToggled)}/> 
            </label>
        </div>
      </div>

 
      {overlayArgs != null ? <TownOverview overlayRef={overlay} args={overlayArgs} setArgs={setOverlayArgs} setMapActive={setMapActive}/> : null}
  
      <Map
        id="MainMap"
        mapStyle="mapbox://styles/ohayorino/cmet1zrt8002r01sc8rfq2fw2"
        mapboxAccessToken={MapAccessToken}
      />
 
    </DeckGL>
    {dashboardActive ? <StatisticsDashboard /> : null}
    {townLayerToggled && <Legend title={"Pollution Level Legend"} lim={pollutantLimitsYearly[Object.keys(pollutants).find(key => pollutants[key].flag == true)]} pol={Object.keys(pollutants).find(key => pollutants[key].flag == true)}/>}

    </>
  );
}
