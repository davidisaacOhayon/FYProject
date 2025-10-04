import {react, useState, useEffect} from 'react';

import '../../Stylesheets/filters.css'

export default function FilterSelection(data, setData){


    // This is usually contains the sets stored within data.
    const dataElements =  data['data'];


    return(
        <>
 
            <ul className={"filter-selection-list"}>
                   
                    {dataElements.map((element, index) => 
                        <label>{element['name']}
                            <input name={element['name']} type={"checkbox"} value={element['name']}/>
                        </label>

                    )}
            </ul>
 
        </>
    )
}