import "../Stylesheets/legends.css";




export default function Legend({title, lim, pol}) {
    
    return (   
        <div className="legend-container"> 
            <h2>{title}</h2>
            <h3>Pollutant : {pol}</h3>
            <hr></hr>

            <ul className={"legend-list"}>
                <li><span className="legend-color-box"  style={{backgroundColor: "green"}}></span> {Math.round((lim / 3), 2) }µg/m³</li>
                <li><span className="legend-color-box" style={{backgroundColor: "yellow"}}></span> {Math.round(((2 * lim ) / 3), 2)}µg/m³</li>
                <li><span className="legend-color-box" style={{backgroundColor: "red"}}></span> {Math.round(((3 * lim ) / 3), 2)}µg/m³</li>
            </ul>
            
        </div>
    )

}