import axios from 'axios';
import Box from '@mui/material/Box';
import { BarChart, LineChart } from '@mui/x-charts';
import {useEffect, useState} from 'react';
import { listofPollutants } from './Backend/PollutantConcentrationLimits';


export default function TownClustering({polTown}){


    // 0 - High Exposure
    // 1 - Medium Exposure
    // 2 - Low Exposure
    const [page, setPage] = useState(0);
 
    const [pol, setPol] = useState("NO2");

    const [data, setData] = useState(null);

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
        .then(res => { console.log(res.data); setData(res.data)})
        .catch(err => console.log(err));
    },[polTown, pol]);


    useEffect(() => {
        handleData();
    }, [pol])


    const exp = ["High Exposure", "Moderate Exposure", "Low Exposure"];


    const handleData = (data) => {
        if (data == null) {
            return;
        }else {
            data.map((month, count) => {
            setMonthData(prev => ({...prev, 
                month: count
            }))
        })
        }



    }


 
    const renderPage = () => {
        return (
            <>

            <Box>
                <BarChart
                
                    xAxis={[{ scaleType: "band", data : Object.keys(monthData)}]}
                    series={[{label: "Days Of Occurance", data : Object.values(data[page])}]}
                    height={300}
                    sx={{
                        '.MuiChartsAxis-line': { stroke: '#fff !important' },       // axis lines white
                        '.MuiChartsAxis-tick': { stroke: '#fff !important' },       // tick marks white
                        '.MuiChartsAxis-tickLabel': { fill: '#fff !important' },    // tick text white
                        '.MuiChartsLegend-root': { color: '#fff !important' },      // legend white
                        '.MuiChartsTooltip-root': { color: '#fff !important' },     // tooltip text black
                        '.MuiChartsTooltip-paper': { background: '#fff !important' } // tooltip background white
                    }}/>


            </Box>
            </>
        )
    }
 

    return(
        <>
        <h2>Statistics for {pol}</h2>
        <hr></hr>
        <br></br>
        <h3> {pol} - {exp[page]} in {polTown} </h3>
        <p> Displays Number of days concentrations were recorded at various exposure levels.</p>
        <button className={"btn"} onClick={() => setPage(2)}>Low Exp</button>
        <button className={"btn"} onClick={() => setPage(1)}>Mid Exp</button>
        <button className={"btn"} onClick={() => setPage(0)}>High Exp</button>
        <ol>
            {listofPollutants.map(poll => {
                return <button className={pol == poll? "btn active" : "btn"} onClick={() => setPol(poll)}>{poll}</button>
            })}
        </ol>
        {data != null ? renderPage() : null}
        </>
    )



}