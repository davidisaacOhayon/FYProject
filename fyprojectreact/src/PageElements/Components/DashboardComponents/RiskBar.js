import Box from '@mui/material/Box';



export default function RiskBar({perc, title}) {

    return (
        <>

            <h3>{title}</h3>
            <h4>{perc > 1 ? `${(perc - 1).toFixed(2) * 10} % Increased Risk` : "No Excess Risk" }</h4>
            <Box sx={{ width: '100%', backgroundColor: '#ddd', borderRadius: '5px' }}>
                <Box sx={{ width: `${perc}%`, backgroundColor: '#e72a39', height: '20px', borderRadius: '5px' }} />
            </Box>
        </>
    );
}