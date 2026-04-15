import Box from '@mui/material/Box';



export default function RiskBar({perc, title}) {

    return (
        <div className={"risk-div"}>
            <h3>{title}</h3>
 
            <h4>{perc > 1 ? ` ${(perc * 100).toFixed(2) - 100}% Increased Risk` : "No Excess Risk" }</h4>
        </div>
    );
}