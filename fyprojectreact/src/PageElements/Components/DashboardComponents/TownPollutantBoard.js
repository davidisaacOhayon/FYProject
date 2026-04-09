import {useEffect, useState, Suspense, useMemo, useContext} from 'react';
import axios from 'axios';
import { BarChart} from '@mui/x-charts';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { diseaseNames, diseases, WHOThresholds } from '../Backend/PollutionInfo';
import Box from "@mui/material/Box";
import { render } from 'katex';
import {RisksContext} from '../../IndexMap.js';

export default function TownPollutantBoard(towns) {

    const {relativeRiskData} = useContext(RisksContext);

    const [pollutant, setPollutant] = useState("SO2");

    const [townReadings, setTownReadings] = useState(null);

    // Average of all town averages
    const [edaData, setEdaData] = useState(null);

    const [isLoading, setLoading] = useState(true);

    const [disease, setDisease] = useState("RES");

    const [diseaseData, setDiseaseData] = useState(null);
    const formatRisk = (input) => {
       return <h4>{input > 1 ? `+${((input - 1) * 10).toFixed(2)}% ` : "N/A" }</h4>
    }

    const computeData = async () => {
        

        if (pollutant === null) {
            return;
        }
        console.log("computing" + JSON.stringify(towns["towns"]));

        // Compute highest pollutant holder
        let res =  await axios.post(`/getPollutantAvgTowns/`, {"towns": towns.towns, "pollutant": pollutant});
        
        let rawData = res.data;

        setTownReadings(rawData);

        await computeStats(rawData);  

        await computeDiseases(towns.towns);
    
    
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

    const computeDiseases = async (towns) => {

        let res = await axios.post("/getDiseaseRisksTowns" , {"towns": towns, "risks": relativeRiskData});

        const data = res.data;

        console.log(`Disease risks calculated ${JSON.stringify(data)}`);

        setDiseaseData(data);

    }

    const computeStats = async (data) => {
        let averages = data.map((e) => e.avg);
        console.log(averages);
        
        // Compute Average of averages
        let collectiveAvg = Math.round((averages.reduce( (a,b) => a + b) / averages.length), 2);

        // const getEDA = async () => {
        // why is towns not an array on its own????
        const res = await axios.post('/getEDATownsPol', {"towns" : towns["towns"], "pollutant" : pollutant});
        console.log(`Received data ${JSON.stringify (res.data)}`)
        setEdaData(res.data);
        // }

   
 


    }

    
 

 
    


    const renderContents = () => {
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
                        <button className={"pollutant-filter-button"} onClick={() => setPollutant("O3")}>O3</button>
                    </div>
                    <div className={"town-pollutant-entries"}>
                            
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
        <div className={"town-pollutant-statistics"}>
            <h2>Analysis</h2>
            <hr></hr>

            <div className={"eda-data-container"}>
                <div className={"eda-data-div"}>
                    <h3>Standard Deviation:</h3>
                    <p> {edaData["STD"]} µg/m³</p>
                </div>

                <div className={"eda-data-div"}>
                    <h3>Mean:</h3>
                    <p> {edaData["Average"]} µg/m³</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Range:</h3>
                    <p>µg/m³</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Interquartile Range:</h3>
                    <p> µg/m³</p>
                    <p style={{fontSize: "1rem"}}>Q1:  µg/m³ </p> 
                    <p style={{fontSize: "1rem"}}> Q3:  µg/m³</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Most Polluted Town:</h3>
                    <p>{edaData["worst"]}</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Least Polluted Town:</h3>
                    <p>{edaData["best"]}</p>
                </div>
            </div>





            <h2>Mortality Risks for {diseaseNames[disease]}</h2>
            <hr />
            
            <div className={"board-pollutant-filter"}>
                <button className={"pollutant-filter-button"} onClick={() => setDisease("RES")}>Respiratory</button>
                <button className={"pollutant-filter-button"} onClick={() => setDisease("COPD")}>COPD</button>
                <button className={"pollutant-filter-button"} onClick={() => setDisease("CVD")}>Cardiovascular</button>
                <button className={"pollutant-filter-button"} onClick={() => setDisease("IHD")}>IHD</button>
                <button className={"pollutant-filter-button"} onClick={() => setDisease("LUNGC")}>Lung Cancer</button>
            </div>

            
            
            <table className={"disease-table-dashboard"}>
                 
                <tr>
                    <td><b>Town</b></td>
                    <td><b>PM 2.5</b></td>
                    <td><b>PM 10</b></td>
                    <td><b>NO2</b></td>
                    <td><b>O3</b></td>
                </tr>

                {diseaseData.map((set) => {
                    return (
                        <tr>
                            <td>{set.Town}</td>
                            <td>{formatRisk(set[disease]["PM25"]) || "N/A"}</td>
                            <td>{formatRisk(set[disease]["PM10"]) || "N/A"}</td>
                            <td>{formatRisk(set[disease]["NO2"]) || "N/A"}</td>
                            <td>{formatRisk(set[disease]["O3"]) || "N/A"}</td>
                        </tr>
                    )
                })}

            </table>

            {/* <div className={"distribution-graph"}>

            </div> */}
                    
        </div>
    </>
)
}
  

    // Initialisation on render
    useEffect( () => {
        computeData();
    }, [pollutant]);

    // Data load checker
    useEffect(() => {

        // Check if data is loaded
        if (edaData !== null && townReadings !== null && diseaseData !== null ) {
            setLoading(false);
        } 
    }, [edaData, townReadings, diseaseData])
 

    if (!isLoading) {
        return renderContents();
    }else{
        return <h2>Data is loading...</h2>
    }

 
}