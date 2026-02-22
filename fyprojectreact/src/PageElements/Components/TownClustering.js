import axios from 'axios';
import Box from '@mui/material/Box';
import { BarChart, LineChart } from '@mui/x-charts';
import {useEffect, useState} from 'react';



export default function TownClustering({polTown, pollutant}){


    // 0 - High Exposure
    // 1 - Medium Exposure
    // 2 - Low Exposure
    const [page, setPage] = useState(0);
 
    const [data, setData] = useState(null);

    useEffect(() => {
        axios.post("/getTownExpPolCluster/", {town: polTown, pollutant: pollutant})
        .then(res => setData(res.data))
        .catch(err => console.log(err));
    },[polTown, pollutant])




    const renderPage = () => {

        switch ( page ) {
            case 0:
                return renderHExposure();
        }
    }
    const renderHExposure = () => {
        return (
            <>
            <h3> {pollutant} - High Exposure </h3>
            <Box>
                <BarChart
                
                    xAxis={[{ scaleType: "band", data : [1,2,34,5,6,7]}]}

                    series={[{data : [1,2,3,4,5,6]}]}
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
        <h2>Statistics for {pollutant}</h2>
        <hr></hr>
        <br></br>
        {renderPage()}
        </>
    )



}