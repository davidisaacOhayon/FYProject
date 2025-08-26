import {useState} from 'react';
import Map   from 'react-map-gl/mapbox';
import DeckGL, {GeoJsonLayer} from 'deck.gl';  
import 'mapbox-gl/dist/mapbox-gl.css';





export default function IndexMap(){

    const MapStyle = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/dark-gray";

    const MapAccessToken = "pk.eyJ1Ijoib2hheW9yaW5vIiwiYSI6ImNtZXN1bjd4ODA4d2QyanM4aTBiNm9zN2gifQ.JAp21RU5bHyH5Y0xzdOZvQ";

    const INITIAL_MAP_STATE = {

        latitude: 39.8283,
        longitude: -98.5795,
        zoom: 3,
        bearing: 0,
        pitch: 30
    }


    return (
        <>
        <DeckGL
            initialViewState={INITIAL_MAP_STATE}
            controller={true}
        >
            <Map mapStyle={"mapbox://styles/mapbox/streets-v9"} mapboxAccessToken={MapAccessToken} />


        </DeckGL>

        
        </>

    );




}