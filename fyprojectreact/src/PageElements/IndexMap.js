import {useState} from 'react';
import Map   from 'react-map-gl/mapbox';
import DeckGL, {GeoJsonLayer} from 'deck.gl';  
import 'mapbox-gl/dist/mapbox-gl.css';
import "./Stylesheets/main.css";


 


export default function IndexMap(){

    const MapStyle = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/dark-gray";

    const MapAccessToken = "pk.eyJ1Ijoib2hheW9yaW5vIiwiYSI6ImNtZXN1bjd4ODA4d2QyanM4aTBiNm9zN2gifQ.JAp21RU5bHyH5Y0xzdOZvQ";

    const INITIAL_MAP_STATE = {

        latitude: 35.9375,
        longitude: 14.3754,
        zoom: 10,
        bearing: 0,
        pitch: 0

    }

 


    return (
        <>
        <DeckGL
            initialViewState={INITIAL_MAP_STATE}
            controller={true}>

            <div className={"map-controls"}>
                <button className={"map-control-btn"}>Filters</button>
                <button className={"map-control-btn"}>Pollutants</button>
                <button className={"map-control-btn"}>Borders</button>

            </div>
            <Map id={"MainMap"} mapStyle={"mapbox://styles/ohayorino/cmet1zrt8002r01sc8rfq2fw2"} mapboxAccessToken={MapAccessToken} />

        </DeckGL>

        
        </>

    );




}