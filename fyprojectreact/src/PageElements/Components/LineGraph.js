import Box from "@mui/material/Box";





export default function LineGraph({xData, yData, xDataScale, yDataScale}){



    return (
        <>
            <Box sx={{ height: 300, width: '100%' }}>
                <LineChart
                    xAxis={[{ data: xData, 
                        scaleType: xDataScale != null ? xDataScale : 'linear' 
                     }]}
                    series={[
                        {
                            data: yData,
                            type: 'line',
                            smooth: true,
                            scaleType: yDataScale != null ? yDataScale : 'linear',
                            marker: { size: 4 },
                        },
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
        </>
    )



}