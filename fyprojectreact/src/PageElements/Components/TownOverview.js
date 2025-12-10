

// When a user hovers over a town, we will retrieve the latest pollutant reading
// to then display it on an overlay box on the town, inplace of the cursor.

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getTownPollution } from "./Backend/Database_connections";
import { pollutantDBKeyMap } from "./Backend/PollutantConcentrationLimits";



import '../Stylesheets/townoverview.css';
import Button from "@mui/material/Button";
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts';

export default function TownOverview({args, overlayRef}){

    // Contains retrieved data from requests
    const [pollutantReadings, setPollutants] = useState(null);
    
    // Contains applied pollutants for filtering
    const [pollutantFilter, setPollutantFilter] = useState([]);
    
    // List down each pollutant key
    const pollutants = ['SO2', 'NO', 'NO2', 'PM25','PM10']

    // Display Data for graph visuals (Y-Axis)
    const [displayData, setDisplayData] = useState(null);

    // Retains all possible years of data collected
    const [yearData, setYearData] = useState(null);

    const pollutantColors = {
        'SO2': "#f5d142",
        'NO' : "#b8c916",
        'NO2': "#1652c9",
        'PM25': "#c92e16",
        'PM10': '#96000d'
    }
    // Process pollutant data for risk analysis on potential diseases
    useEffect(() => {
        if( args.townName == null){
            return
        }

                
        // Retrieve pollutant info on town
        axios.get(`http://localhost:8000/getPollutantVolTown/?town=${args.townName}`)
        .then(res => {setPollutants(res.data) 
            console.log(`Data retrieved ${res.data}`)}) 
        .catch(err => console.log(err.res.data))
        
        loadPollutantsDataset();
        
        // Retrieve town pollution data of previous month.
        // Go over latest mean reading of pollutant concentrations
        // Compare readings with conventional tolerant limits
        // Correspond any excess concentrations with respective diseases.
        // If there are no excesses, return that town is in a 'healthy' state

    },[args])

    const renderFrequencyGraph = () => {
        return null
    }

    const applyPollutant = (pol) => {
        if (!checkActivePollutant(pol)) {
            setPollutantFilter(prev => [...prev, pol])
        }else{
            setPollutantFilter(prev => [...prev.filter(x => pol !== x)])
        }
    }

    const checkActivePollutant = (pol) =>{
        return pollutantFilter.includes(pol);
    }

    const retrievePollutionSet = (pol) =>{
        let polData = [];
        // console.log(`At RetrievePollution with ${pol}`)
        if (!pollutantReadings){
            // console.log(`At RetrievePollution return`)
            return;
        }
        pollutantReadings.map((dataset, index) => {
            // console.log(`At RetrievePollution mapper of ${pol}, dataset reading ${Object.values(dataset['SO2'])}`)
            // console.log(`At RetrievePollution mapper of ${pol}, retrieved ${dataset[pol]}`)
            polData.push(dataset[pol]);
        });

        return {data: polData};
    }

    const loadPollutantsDataset = () => {
        console.log("retrieving data")
        let data = []
        let dateData = []
        if (pollutantReadings) {
            console.log("Mapping pollutants")
            pollutantFilter.map((pol, index) => {
                
                console.log("retrieving pollutant", pol)
                data.push(retrievePollutionSet(pollutantDBKeyMap[pol]))
            })
            setDisplayData(data);

            pollutantReadings.map((set, index) => {
                console.log(`Retrieved date ${set['day']}`)
                let year = parseInt(set['day']);
    
                console.log(`retrieved year ${year}`)
                if (!dateData.includes(year)){
                    dateData.push(year)
                }
            })
            setYearData(dateData);
        }else{
            return;
        }
    }

 
    useEffect(() => {
        if (displayData !== null){
            console.log(displayData)
            console.log(`year data ${yearData}`)
        }
    }, [displayData])


 


    return(
        <>
            <div 
                ref={overlayRef} 
                className={'town-overview'} 
                style={{position: 'absolute', top: args.yPos, left: args.xPos}}>
                <h2>{args.townName}</h2>
                <hr/>
                <ul className={'pollutant-filters'}>
                    {pollutants.map((e, index) => 
                        <li key={index} style={ checkActivePollutant(e) ? {backgroundColor : pollutantColors[e]} : {backgroundColor : "#1f1f1f"}} className={checkActivePollutant(e) ? 'pol-btn active' : 'pol-btn'}>
                         <Button onClick={() => applyPollutant(e)}>{e}</Button>
                        </li>
                    )}

                </ul>

                <div className={'town-overview-details'}>

                <Box>
                    <LineChart
                    xAxis={yearData !== null ? yearData : []}
                    series={displayData !== null ? displayData : []}
                    height={300}
                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#fff' },       // axis lines white
                        '.MuiChartsAxis-tick': { stroke: '#fff' },       // tick marks white
                        '.MuiChartsAxis-tickLabel': { fill: '#fff' },    // tick text white
                        '.MuiChartsLegend-root': { color: '#fff' },      // legend white
                        '.MuiChartsTooltip-root': { color: '#000' },     // tooltip text black
                        '.MuiChartsTooltip-paper': { background: '#fff' } // tooltip background white
                    }}
                    />
                </Box>
                </div>
            </div>
        </>
    )



}