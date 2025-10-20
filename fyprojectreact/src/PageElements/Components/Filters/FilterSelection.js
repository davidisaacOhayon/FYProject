import {react, useState, useEffect} from 'react';

import '../../Stylesheets/filters.css'

export default function FilterssSelection({data, setData}){


    const changeData = (id) => {

        const key = Object.keys(data)[id];

        setData(prev => ({
            ...prev, [key] : {...prev[key], flag: !data[key].flag}
        }))
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
                        <label>{element["name"]}
                            <input onChange={() => {changeData(index)}} name={element['name']} type={"checkbox"} value={element['name']}/>
                        </label>

                    )}
            </ul>
        </>
    )
}