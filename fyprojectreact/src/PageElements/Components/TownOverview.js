

// When a user hovers over a town, we will retrieve the latest pollutant reading
// to then display it on an overlay box on the town, inplace of the cursor.

import { useEffect, useState } from "react"

import '../Stylesheets/townoverview.css';

export default function TownOverview({args}){


    const [town, setTown] = useState(null);
    // Process pollutant data for risk analysis on potential diseases
    useEffect(() => {
        // Logic

        // Retrieve town pollution data of previous month.
        

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
                <br/>
                <div className={'town-overview-details'}>

                </div>



            </div>
        </>
    )



}