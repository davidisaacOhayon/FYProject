import {react, useState, useEffect} from 'react';

import '../../Stylesheets/filters.css'
import { polAcronymNameMap } from '../Backend/PollutionInfo';

export default function FiltersSelection({data, setData}){


    const changeData = (id) => {

        const key = Object.keys(data)[id];

        // Set all other flags to false but the one that was just clicked
        setData(prev => {
            let newData = {...prev};
            
            // Set all flags to false
            Object.keys(newData).forEach(k => {
                newData[k].flag = false;
            })

            newData[key].flag = !newData[key].flag;

            return newData;
        })
    }

    useEffect(() => {
        Object.entries(data).map((el, index) =>{
            console.log(el);
        })

    },[data])

    return(
        <>
            <ul className={"filter-selection-list"}>
                    {Object.values(data).map((element, index) => 
                        <>
                        <label className={"filter-label"} for={element['name']}>{polAcronymNameMap[element['name']] || element["name"]}</label>
                        <input onChange={() => {changeData(index)}} name={element['name']} checked={element['flag']} type={"checkbox"} value={element['name']}/>
                        </>

                    )}

            </ul>
        </>
    )
}