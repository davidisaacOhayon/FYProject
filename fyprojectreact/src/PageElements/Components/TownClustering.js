import axios from 'axios';
import Box from '@mui/material/Box';
import { BarChart, LineChart, ScatterChart } from '@mui/x-charts';
import {useEffect, useState} from 'react';
import { listofPollutants } from './Backend/PollutantConcentrationLimits';
import '../Stylesheets/townclustering.css';

export default function TownClustering({polTown}){


    // 0 - High Exposure
    // 1 - Medium Exposure
    // 2 - Low Exposure
    const [page, setPage] = useState(0);
 
    const [pol, setPol] = useState("NO2");

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [monthData, setMonthData] = useState({
        "Jan": 0,
        "Feb": 0,
        "Mar": 0,
        "Apr": 0,
        "May": 0,
        "Jun": 0,
        "Jul": 0,
        "Aug": 0,
        "Sep": 0,
        "Oct": 0,
        "Nov": 0,
        "Dec": 0
        
    });

    // EDA Data
    const [edaData, setEdaData] = useState(null);

    const resetMonthData = () => {
        setMonthData({
        "Jan": 0,
        "Feb": 0,
        "Mar": 0,
        "Apr": 0,
        "May": 0,
        "Jun": 0,
        "Jul": 0,
        "Aug": 0,
        "Sep": 0,
        "Oct": 0,
        "Nov": 0,
        "Dec": 0 
    });
    }
    useEffect(() => {
        resetMonthData(); 
        
        axios.post("/getTownExpPolCluster/", {town: polTown, pollutant: pol})
        .then(res => { 
            setData(res.data);
        })
        .catch(err => console.log(err));

        axios.get(`/getEDATownPol/?town=${polTown}&pollutant=${pol}`)
        .then(res => {
            console.log(res.data);
            setEdaData(res.data);
        })
        .catch(err => console.log(err));

    },[polTown, pol]);


    const exp = ["Low Exposure", "Medium Exposure", "High Exposure"];

    const expColors = ["#4255FB", "#FFB423", "#FA4F58"];
 
    const renderPage = () => {
        return (
            <>

            <Box>
                <BarChart

                    xAxis={[{ scaleType: "band", data : Object.keys(monthData)}]}
                    series={[{color: expColors[page], label: "Days Of Occurance", data : Object.values(data[page]["data"])}]}
                    height={300}
                    valueformatter={(val) => `${val} days`}
                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#fff !important' },       // axis lines white
                        '.MuiChartsAxis-tick': { stroke: '#fff !important' },       // tick marks white
                        '.MuiChartsAxis-tickLabel': { fill: '#fff !important' },    // tick text white
                        '.MuiChartsLegend-root': { color: '#fff !important' },      // legend white
                        '.MuiChartsTooltip-root': { color: '#fff !important' },     // tooltip text black
                        '.MuiChartsTooltip-paper': { background: '#fff !important' } // tooltip background white
                }}/>

                <ScatterChart
                height={300}
                series={
                    Object.entries(data).map(([key, value]) => ({
                    label: exp[key],
                    data: Object.entries(value.data).map(([x, y]) => ({
                        x: x,
                        y: Number(y)
                    }))
                    }))
                }
                xAxis={[{ scaleType: "band", data : Object.keys(monthData)}]}
                                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#fff !important' },       // axis lines white
                        '.MuiChartsAxis-tick': { stroke: '#b26a6a !important' },       // tick marks white
                        '.MuiChartsAxis-tickLabel': { fill: '#fff !important' },    // tick text white
                        '.MuiChartsLegend-root': { color: '#fff !important' },      // legend white
                        '.MuiChartsTooltip-root': { color: '#fff !important' },     // tooltip text black
                        '.MuiChartsTooltip-paper': { background: '#fff !important' } // tooltip background white
                }}
                />


            </Box>
            </>
        )
    }
    // useEffect(() => {
    //     if (data) { 
    //         Object.entries(data).map(([key, value]) => {
    //             Object.entries(value.data).map(([x,y]) => {
    //                 console.log(`{ x : ${x}, y : ${y}}`);
    //             })
    //         }) 
    //     }

    // },[data])
 

    if (data){
        return(
            
            <div className={"pollution-cluster-div"}>
            <h2>Statistics for {pol}</h2>
            <hr></hr>
            <br></br>
            <h3> {pol} - {exp[page]} in {polTown} | Range between {data[page]["min"]}µg/m³ and {data[page]["max"]}µg/m³.</h3>
            <p> Displays Number of days concentrations were recorded at various exposure levels.</p>
            <br></br>
            <button className={"btn"} onClick={() => setPage(2)}>HighExp</button>
            <button className={"btn"} onClick={() => setPage(1)}>Mid Exp</button>
            <button className={"btn"} onClick={() => setPage(0)}>Low Exp</button>
            <ol>
                {listofPollutants.map(poll => {
                    return <button className={pol == poll? "btn active" : "btn"} onClick={() => setPol(poll)}>{poll}</button>
                })}
            </ol>
            {data && renderPage() }
            <h2>Details</h2>
            <hr></hr>
            {[0,1,2].map((page) => { return (
                <p>{data[page]["min"]} - {data[page]["max"]} µg/m³ Range Coverage: {data[page]["coverage"]} % of 365 days </p> 
            )
            })}

            {edaData &&
            <div className={"eda-data-container"}>
                <div className={"eda-data-div"}>
                    <h3>Standard Deviation:</h3>
                    <p>{edaData['STD_Dev']}µg/m³</p>
                </div>

                <div className={"eda-data-div"}>
                    <h3>Mean:</h3>
                    <p>{edaData['Mean']}µg/m³</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Range:</h3>
                    <p>{edaData['Min']} - {edaData['Max']} µg/m³</p>
                </div>
                <div className={"eda-data-div"}>
                    <h3>Interquartile Range:</h3>
                    <p>{edaData['IQR']}µg/m³</p>
                <p style={{fontSize: "1rem"}}>Q1: {edaData["Q1"]}µg/m³ </p> 
                <p style={{fontSize: "1rem"}}> Q3: {edaData["Q3"]}µg/m³</p>
                
                </div>
            </div>

                

            }

            </div>
        )
    }else {
        return <h2>Loading</h2>
    }




}