
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts';


export default function TownOverviewChart({yData, xData}){


    

    return (

    <Box>
        <LineChart
        key={JSON.stringify(xData)}
        xAxis={[ { scaleType: 'band', data : xData !== null ? yData : []}]}
        series={xData !== null ? xData: []}
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

    )

}