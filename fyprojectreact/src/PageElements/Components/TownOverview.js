

// When a user hovers over a town, we will retrieve the latest pollutant reading
// to then display it on an overlay box on the town, inplace of the cursor.

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getTownPollution } from "./Backend/Database_connections";
import { LineChart } from '@mui/x-charts';


import '../Stylesheets/townoverview.css';
import Button from "@mui/material/Button";

export default function TownOverview({args, overlayRef}){



    const [pollutantReadings, setPollutants] = useState(null);
 

    // Process pollutant data for risk analysis on potential diseases
    useEffect(() => {
        if( args.townName == null){
            return
        }

        // Retrieve pollutant info on town
        const data = getTownPollution(args.townName)

        setPollutants(data)
        
        // Retrieve town pollution data of previous month.
        // Go over latest mean reading of pollutant concentrations
        // Compare readings with conventional tolerant limits
        // Correspond any excess concentrations with respective diseases.
        // If there are no excesses, return that town is in a 'healthy' state

    },[])

    const renderFrequencyGraph = () => {
        return null
    }




 

    return(
        <>
            <div 
                ref={overlayRef} 
                className={'town-overview'} 
                style={{position: 'absolute', top: args.yPos, left: args.xPos}}>
                <h2>{args.townName}</h2>
                <hr/>
                <ul className={'pollutant-filters'}>
                    <li className={'pol-btn'}>
                        <Button>SO2</Button>
                    </li>
                    <li className={'pol-btn'}>
                        <Button>PM2.5</Button>
                    </li>
                    <li className={'pol-btn'}>
                        <Button>PM10</Button>
                    </li>
                    <li className={'pol-btn'}>
                        <Button>NO2</Button>
                    </li>
                    <li className={'pol-btn'}>
                        <Button>NO</Button>
                    </li>

                </ul>
                <div className={'town-overview-details'}>
                <LineChart
                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#d9d9d9ff' },
                        '.MuiChartsAxis-tick': { stroke: '#fffffff' },
                        '.MuiChartsAxis-tickLabel': { fill: '#e3e3e3ff' },
                    }}
                    xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                    series={[
                        {
                        data: [2, 5.5, 2, 8.5, 1.5, 5],
                        },
                        ]}
                    height={300}
                />
                </div>
            </div>
        </>
    )



}