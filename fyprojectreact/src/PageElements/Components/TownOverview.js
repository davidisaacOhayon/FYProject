

// When a user hovers over a town, we will retrieve the latest pollutant reading
// to then display it on an overlay box on the town, inplace of the cursor.

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { getTownPollution } from "./Backend/Database_connections";
import { pollutantDBKeyMap, pollutantNameKeyMap } from "./Backend/PollutantConcentrationLimits";


import '../Stylesheets/townoverview.css';
import Button from "@mui/material/Button";
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts';
import { display } from "@mui/system";

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
    const [dateData, setDateData] = useState(null);



    let newX = 0, newY = 0;

    const startX = useRef(0);
    const startY = useRef(0);
    const overlayX = useRef(0);
    const overlayY = useRef(0);

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
            console.log(`Data retrieved ${res.data}`)
             loadRealPollutantSet()
        }) 
            

        .catch(err => console.log(err.res.data))
        
        // loadPollutantsDataset();
       
        
        // Retrieve town pollution data of previous month.
        // Go over latest mean reading of pollutant concentrations
        // Compare readings with conventional tolerant limits
        // Correspond any excess concentrations with respective diseases.
        // If there are no excesses, return that town is in a 'healthy' state

    },[args, pollutantFilter])

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

    const loadRealPollutantSet = () => {
        if (!pollutantReadings){
            return;
        }
        let dataset = []
        let datedataset = []
        pollutantReadings.map( (set, index) => {
            let tempSet = {}
            tempSet["date"] = set['day']
            pollutantFilter.map( (pol ,indx) => {
                
                tempSet[pol] = set[pollutantDBKeyMap[pol]];
                
            })
            dataset.push(tempSet);
        })

        dataset.map(d => {
            datedataset.push(new Date(d.date));
        })

        setDateData(datedataset);

        let tempDataSet = []
        pollutantFilter.map((pol) => {
            let tempSet = {}
            tempSet['label'] = pol;
            tempSet['data'] = dataset.map(d => d[pol] ?? null);
            tempSet['color'] = pollutantColors[pol];
            console.log("TEMP SET BEING PUSHED: " + JSON.stringify(tempSet));
            tempDataSet.push(tempSet);
        });
        setDisplayData(tempDataSet);



    }

    const mouseDown = (e) => {

        e.stopPropagation();
        startX.current = e.clientX;
        startY.current= e.clientY;


        overlayX.current = overlayRef.current.getBoundingClientRect().left;
        overlayY.current = overlayRef.current.getBoundingClientRect().top;

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp)
    }

    const mouseMove = useCallback((e) => {
        e.stopPropagation();
        const el = overlayRef.current;

        const newX = e.clientX;
        const newY = e.clientY;
        

        el.style.left = overlayX.current + (newX - startX.current) + 'px';
        el.style.top =  overlayY.current + (newY - startY.current) + 'px';


    }, [overlayRef])
    
    const mouseUp = (e) => {
        document.removeEventListener('mousemove', mouseMove)
    }

    useEffect(() => {


        const el = overlayRef.current;
        if(!el) {return}

        el.addEventListener('mousedown', mouseDown)

        return () => 
            {
                el.removeEventListener('mousedown', mouseDown)
                document.removeEventListener('mousemove', mouseMove)
                document.removeEventListener('mouseup', mouseUp)
                startX.current = 0;
                startY.current = 0;
                overlayX.current = 0;
                overlayY.current = 0;
                newX = 0;
                newY = 0;
                
            }
    }, [])
 


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
                    xAxis={[
                        {
                        data: dateData !== null ? dateData : [],
                        scaleType: 'time',       
                        }
                        
                    ]}
                    series={[
                        ...displayData !== null ? displayData.map( d => (
                            d
                        )) : []
                    ]}
                    height={300}
                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#fff !important' },       // axis lines white
                        '.MuiChartsAxis-tick': { stroke: '#fff !important' },       // tick marks white
                        '.MuiChartsAxis-tickLabel': { fill: '#fff !important' },    // tick text white
                        '.MuiChartsLegend-root': { color: '#fff !important' },      // legend white
                        '.MuiChartsTooltip-root': { color: '#fff !important' },     // tooltip text black
                        '.MuiChartsTooltip-paper': { background: '#fff !important' } // tooltip background white
                    }}
                    />
                </Box>
                </div>
            </div>
        </>
    )



}