
import Box from '@mui/material/Box';
import "./ProgressBar.css"



export default function ProgressBar({title, value, threshold, color, advLevel}) {
    return (
        <>
            <div className={"progress-bar-container"}>
                <h2>{title} </h2>
                <h4>{advLevel}</h4>
                <h4>{Math.round(value * 100) / 100} µg/m³</h4>
                <h5>EU Threshold: {threshold} µg/m³</h5>
                <div className={"progress-bar"}>
                    <span className={"progress-bar-fill"} style={{width: `${(value / threshold ) * 100}%`, backgroundColor: color}}></span>      
                </div> 
            </div>
        </>
    );
}