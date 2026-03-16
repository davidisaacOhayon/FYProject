import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { pollutantDBKeyMap } from '../Backend/PollutionInfo';
import townPolygons from '../../Datasets/MaltaRegionsPolygons/TownPolygonInfo.json';
import { townsCoordinates } from '../../Datasets/TownCoordinates';



export default async function PollutionMap(pollutant, date ) {



  const formatTownMapData = (heatData) => {
    const data = Object.entries(heatData).map(([key, value]) => {

      const geo = Object.values(townPolygons)
        .find(feature => feature.properties.plain_name === value.town)
        ?.geometry.coordinates;

      return {
        town: value.town,
        pol: value[pollutantDBKeyMap[pollutant]],
        coordinates: townsCoordinates[value.town] ?? null,
        geometry: geo
      };
    });

    console.log("Formatted town map data:", data);
    return data;
  };

  async function loadTownMapData() {

    try {
      const res = await axios.get(`/getTownsReadingsOnDate?date=${date}`);

      const data = res.data;
      console.log("Raw backend data:", data);

      const formatted = formatTownMapData(data);

      return formatted; 
    } catch (err) {
      console.log("Error fetching town map data:", err.message);
    }
  }

  const mapData = await loadTownMapData();
  console.log("Final data for pollution map:", mapData);

  return mapData; 
}