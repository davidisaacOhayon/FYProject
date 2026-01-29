
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts';
import {useEffect} from 'react';
export default function TownOverviewDashboard({town, data, dateData}){

    const pollutantColors = {
        'SO': "#f5d142",
        'NO' : "#b8c916",
        'NO2': "#1652c9",
        'PM25': "#c92e16",
        'PM10': '#96000d'
    };

    useEffect(() => {
        console.log(JSON.stringify(data));
    }, [])
    

    return(
        <div className={"town-item"}>
            <h2>{town}</h2>
            <hr/>
            <Box>
                <LineChart
                    xAxis={[
                        {
                        data: dateData !== null ? dateData : [],
                        scaleType: 'time',      
                        zoom: true,
                        valueFormatter: (date) => {
                            const month = date.getMonth();
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[month]} ${date.getFullYear().toString()}`;
                        }
                        }
                    ]}
                    series={[
                        ...data !== null ? data.map( d => (
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
    )

}