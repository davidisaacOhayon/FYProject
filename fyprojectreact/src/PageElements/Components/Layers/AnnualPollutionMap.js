import DeckGL, { PolygonLayer, TextLayer } from 'deck.gl';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { pollutantDBKeyMap } from '../Backend/PollutionInfo';
import townPolygons from '../../Datasets/MaltaRegionsPolygons/TownPolygonInfo.json';
import { townsCoordinates } from '../../Datasets/TownCoordinates';
export default async function AnnualPollutionMap(pollutant){

    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");


    const formatTownMapData = (heatData) => {
        const data = Object.entries(heatData).map(([key, value]) => {

        const geo = Object.values(townPolygons)
            .find(feature => feature.properties.plain_name === value.town)
            ?.geometry.coordinates;

        return {
            town: value.town,
            pol: value.avg,
            coordinates: townsCoordinates[value.town] ?? null,
            geometry: geo
        };
        });

        console.log("Formatted town map data:", data);
        return data;
  };

  async function loadTownMapData(){

    let data;

    try{

        // Get available towns
        const townRes = await axios.get('/getAvailableTownNames');

        // Format towns list
        const towns = townRes.data.map(t => t);

        // const towns = ["Attard"]

        // Post request for data
        const res = await axios.post(`/getPollutantAvgTowns/`, {"towns" : towns, "pollutant": pollutant});
        const raw = res.data; 


        // Format raw data
        data = formatTownMapData(raw);
        console.log("OUTER Formatted town map data:", data);



    }catch (err) {
        console.log("err", err)
    };
    return data;
  }


  let data = await loadTownMapData();
//   console.log(`${JSON.stringify(data)}`)
  return data;


}