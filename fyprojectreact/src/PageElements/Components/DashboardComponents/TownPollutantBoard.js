import {useEffect, useState, Suspense} from 'react';
import axios from 'axios';
import { BarChart} from '@mui/x-charts';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { WHOThresholds } from '../Backend/PollutionInfo';
import Box from "@mui/material/Box";


export default function TownPollutantBoard(towns) {


    const [pollutant, setPollutant] = useState("SO2");

    const [townReadings, setTownReadings] = useState(null);

    const computePollutants = () => {
        let rawData;

        if (pollutant === null) {
            return;
        }
        console.log("computing" + JSON.stringify(towns["towns"]));
        // Logic to compute highest pollutant holder
        axios.post(`/getPollutantAvgTowns/`, {"towns": towns.towns, "pollutant": pollutant})
        .then(res => rawData = res.data)
        .then(() => {
            console.log(JSON.stringify(rawData));
            setTownReadings(rawData);
        })
    }
    
    const computeAdverseLevel = (pol, avg) => {
        const threshold = WHOThresholds[pol] / 3;

        if(avg <= threshold){
            return "Healthy";
        } else if (avg >= threshold && avg <= threshold * 2){
            return "Moderate";
        }else if (avg > threshold * 3){
            return "At Risk";
        }

    }

    useEffect(() => {
        computePollutants()
    }, [pollutant]);

  

    return(
        <>
            <div className={"town-pollutant-board"}>
                <h2>Average Annual Concentration Of {pollutant}</h2>
                <hr></hr>

                <div className={"town-pollutant-entries-container"}>
                    <div className={"town-pollutant-entries-section"}>
                        <div className={"board-pollutant-filter"}>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("SO2")}>SO2</button>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("NO2")}>NO2</button>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("PM10")}>PM10</button>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("PM25")}>PM2.5</button>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("NO")}>NO</button>
                            <button className={"pollutant-filter-button"} onClick={() => setPollutant("O3")}>O3</button>
                        </div>
                        <div className={"town-pollutant-entries"}>
                            <Suspense fallback={<p>Loading...</p>}></Suspense>
                                {townReadings ? townReadings.map((townEntry) => {
                                            return(
                                                <div className={"town-pollutant-entry"}>
                                                    <h3>{townEntry.town} | {computeAdverseLevel(pollutant, townEntry.avg)}</h3>
                                                    <p>{townEntry.avg} µg/m³</p>
                                                </div>
                                        )
                            }) : <p>Loading...</p>}
                        </div>
                    </div>

                    <div className={"town-pollutant-bar-graph"}>

                            {townReadings ? 
                            <Box className={"town-pollutant-bar-graph-box"} sx={{ height: '80%', width: '100%' }}>
                            <BarChart
                            dataset={townReadings}
                            yAxis={[{ scaleType: 'band', dataKey: 'town', max: 50}]}
                            series={[{ dataKey: 'avg', label: `${pollutant} Average` }]}
                            layout="horizontal"
                            grid={{ vertical: true }}
                            sx={{
                                '.MuiChartsAxis-line': { stroke: '#fff !important' },       // axis lines white
                                '.MuiChartsAxis-tick': { stroke: '#fff !important' },       // tick marks white
                                '.MuiChartsAxis-tickLabel': { fill: '#fff !important' },    // tick text white
                                '.MuiChartsLegend-root': { color: '#fff !important' },      // legend white
                                '.MuiChartsTooltip-root': { color: '#fff !important' },     // tooltip text black
                                '.MuiChartsTooltip-paper': { background: '#fff !important' } // tooltip background white
                            }}>       
                            <ChartsReferenceLine
                                x={WHOThresholds[pollutant]} // value where the line hits
                                axis="y"          // because threshold is horizontal
                                stroke="red"      // line color
                                strokeDasharray="4 2"
                                lineStyle={{ stroke: 'red', strokeWidth: 2, strokeDasharray: '5 5' }} // optional dashed style
                            /></BarChart>  </Box>: <p>Loading...</p>
                            }
                            <h2>{pollutant} threshold as declared by WHO: {WHOThresholds[pollutant]} µg/m³</h2>
                            
                    </div>


                </div>

            </div>
        
        </>
    )
}