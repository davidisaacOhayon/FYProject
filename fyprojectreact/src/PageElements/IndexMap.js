  import { useEffect, useState, useRef, useCallback, useContext, createContext, useMemo} from 'react';
import Map from 'react-map-gl/mapbox';
import axios from 'axios';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import { getTownClusters } from './Components/Backend/Database_connections';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Stylesheets/main.css';
import mData from './Datasets/MaltaRegionsPolygons/MaltaGeoJSON.geojson';
import tData from './Datasets/MaltaDistricts.Json';
import FilterSelection from './Components/Filters/FilterSelection';
import TownOverview from './Components/TownOverview';
import StatisticsDashboard from './StatisticsDashboard';

const OverlayContext = createContext(null);
 
export default function IndexMap() {





  const [dashboardActive, setDashboardActive] = useState(false);

  const [mapActive, setMapActive] = useState(true);
  
  // Holds the map layers of Deck.GL. 
  const [mapLayers, setMapLayers] = useState([]);

  // Town Clusters for data heatmap
  const [townClusters, setTownClusters] = useState(null);

  // Contains info of all pollutants we will monitor
  const [pollutants, setPollutants] = useState({
    "SO" : { name: "Sulfur Dioxide - SO2", flag : false, col : "#F5E027"},
    "PM2" : { name: "PM 2.5", flag : false, col : "#24A3D4"},
    "PM10" : { name: "PM 10", flag : false, col : "#24A3D4"},
    "NO2" :{ name: "Nitrogen Dioxide - NO2", flag : false, col : "#24A3D4"},
    "O3" : { name: "Ozone - O3", flag : false, col : "#24A3D4"}
  })

  const [views, setViews] = useState({
     "Town Overview" : { name: "Town Overview", flag : true, col : "#F5E027"},
     "Town Columns" :{ name: "Lung Cancer", flag : false, col : "#F5E027"},
  }
  )

  // Current town being hovered
  const [hoveredTown, setHovered] = useState(null);

  // Overlay Arguments for town detail upon mouse click for town
  const [overlayArgs, setOverlayArgs] = useState(null);

  // Pollutant Filter reference
  const pollutantFilter = useRef(null);

  // View Filter reference
  const viewFilter = useRef(null);

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



  const formatClusteredHeatMapData = () => {
    if (!townClusters){
      return null;
    }
    const data = townClusters.map(cluster => {
        return {
          coordinates: cluster[0].coordinates,
          coverage: cluster[0].coverage
        }
    })

    console.log(data);

    return data;
  }

  const loadHeatMapData = () => {

    const selected = Object.entries(pollutants).find(([key, value]) => value.flag);

    if (!selected){
      return;
    }
    const pollutantKey = selected[0];

    axios.get(`http://localhost:8000/getTownExpPolClusters?pollutant=${pollutantKey}`)
    .then(res => {  setTownClusters(res.data); console.log(res.data)})
    .finally(() => {
    })
    .catch(err => console.log(err.message));
  }





  useEffect(() => {
  const layers = [PollutionRegionlayer];

  if (townClusters) {
    layers.push(HeatMapLayerClustered);
  }

  if (hoveredTown) {
    layers.push(SelectedRegionLayer);
  }

  setMapLayers(layers);
}, [townClusters, hoveredTown]);

  useEffect(() => {
    const selectedPol = Object.keys(pollutants).find(key => pollutants[key].flag);
    if (selectedPol){
      loadHeatMapData();
    }
  }, [pollutants])

  //////// BACKEND COMMUNICATION




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

  useEffect(() => {
    setInterval(() => {
      console.log(townClusters)
      console.log(mapLayers);
    }, 1500);
    
  }, [mapLayers])
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

  // Use Effect to re-render heatmap layer with new data upon pollutant selection
  useEffect(() => {
    if (townClusters && townClusters.length > 0) {
      setMapLayers(prev => {
        const filtered = prev.filter(layer => layer.id !== 'HeatmapLayer');
        return [...filtered, HeatMapLayerClustered];
      });
    }
  }, [pollutants, townClusters])
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


  // Heat Map Layer for pollutant exposure clusters
  const HeatMapLayerClustered = new HeatmapLayer({
    id: 'HeatmapLayerClustered',
    data: formatClusteredHeatMapData(),
    getPosition: d => d.coordinates,
    getWeight: d => d.coverage,
    radiusPixels: 60,
  });


  return (
    <>
    <DeckGL controller={mapActive} ref={deckRef} initialViewState={INITIAL_MAP_STATE}layers={mapLayers}>
      <div ref={filterOptions} className={"map-controls-div"}>
        <div className="map-controls">
          <h2 className="filter-title">Filters</h2>
          <button onClick={() => setFilter('pollutantFilter')} className={selectedFilter == 'pollutantFilter' ? "map-control-btn active" : "map-control-btn"}>Pollutants</button>
          <button onClick={() => setFilter('viewFilter')} className={selectedFilter == 'viewFilter' ? "map-control-btn active" : "map-control-btn"}>Views</button>
          <button className="map-control-btn" onClick={ () => setDashboardActive(!dashboardActive)}>Stats Monitor</button>
        </div>
        <div ref={filterBox} className={selectedFilter ? "filters-content active" : "filters-content"}>
          {selectedFilter == 'pollutantFilter' ? <FilterSelection useRef={pollutantFilter} data={pollutants} setData={setPollutants} /> : null}
          {selectedFilter == 'viewFilter' ? <FilterSelection useRef={viewFilter} data={views} setData={setViews} /> : null}
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
    </>
  );
}
