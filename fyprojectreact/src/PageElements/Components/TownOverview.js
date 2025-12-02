

// When a user hovers over a town, we will retrieve the latest pollutant reading
// to then display it on an overlay box on the town, inplace of the cursor.

import { useEffect, useState } from "react"

import '../Stylesheets/townoverview.css';

export default function TownOverview({args}){


    const [pollutantReadings, setPollutants] = useState(null);
    // Process pollutant data for risk analysis on potential diseases
    useEffect(() => {
        // Logic



        // Retrieve town pollution data of previous month.
        axios.get(`http://localhost:8000/getPollutantVolTown/?town=${args.townName}`)
        .then(res => setPollutants(res.data))
        .catch(err => console.log(err.data.response))

        // Go over latest mean reading of pollutant concentrations
        // Compare readings with conventional tolerant limits
        // Correspond any excess concentrations with respective diseases.

        // If there are no excesses, return that town is in a 'healthy' state

    },[])

    if( args == null){
        return
    }


    return(
        <>
            <div className={'town-overview'} style={{position: 'absolute', top: args.yPos, left: args.xPos}}>
                <h2>{args.townName}</h2>
                <hr/>
                <div className={'town-overview-details'}>

                </div>



            </div>
        </>
    )



}