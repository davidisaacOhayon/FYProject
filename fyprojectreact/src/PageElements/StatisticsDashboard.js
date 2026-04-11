

import './Stylesheets/statisticsdashboard.css';
import {useState, useEffect, Suspense} from 'react';
import TownPollutantBoard from './Components/DashboardComponents/TownPollutantBoard';
import axios from 'axios';
import TownOverviewDashboard from './Components/DashboardComponents/TownOverviewDashboard';
import TownOverviewDashboardCombined from './Components/DashboardComponents/TownOverviewDashboardCombined';
import { pollutantDBKeyMap, pollutantColors} from './Components/Backend/PollutionInfo';
import Slider from '@mui/material/Slider';

// TO DO FOR LATE STAGE:
// OPTIMIZE YEARLYDATA AS EACH TOWN IS BEING GIVEN THEIR OWN YEARLY DATA OBJECT, COULD BE
// MADE GLOBALLY.

export default function StatisticsDashboard(){


    const marks = [
        { value: 0, label: "Jan" },
        { value: 1, label: "Feb" },
        { value: 2, label: "Mar" },
        { value: 3, label: "Apr" },
        { value: 4, label: "May" },
        { value: 5, label: "Jun" },
        { value: 6, label: "Jul" },
        { value: 7, label: "Aug" },
        { value: 8, label: "Sep" },
        { value: 9, label: "Oct" },
        { value: 10, label: "Nov" },
        { value: 11, label: "Dec" },
    ];

    const [monthRange, setMonthRange] = useState([0,11]);

    const [globalData, setGlobalData] = useState(null);

    // Contains applied pollutants for filtering
    const [pollutantFilter, setPollutantFilter] = useState([]);

    // Contains applied towns for filtering
    const [townFilter, setTownFilter] = useState([]);

    // 0 : Divided Graph, 1 : Combined Graph
    const [graphView, setGraphView] = useState(0);


    const [isLoading, setLoading] = useState(false);

    // List down each pollutant key
    const pollutants = ['SO2', 'NO2', 'PM25','PM10', 'O3']

    const townNames = [
    "San Lawrenz",
    "Ghasri",
    "Kercem",
    "Zebbug (Gozo)",
    "Xaghra",
    "Victoria",
    "Fontana",
    "Munxar",
    "Sannat",
    "Qala",
    "Nadur",
    "Xewkija",
    "Ghajnsielem",
    "Attard",
    "Naxxar",
    "Mosta",
    "Lija",
    "Rabat",
    "Mtarfa",
    "Mdina",
    "Zebbug",
    "Balzan",
    "Dingli",
    "Mellieha",
    "Mgarr",
    "St Paul's Bay",
    "Zejtun",
    "Zabbar",
    "Kalkara",
    "Ghaxaq",
    "Marsaskala",
    "Birzebbugia",
    "Zurrieq",
    "Luqa",
    "Mqabba",
    "Qrendi",
    "Safi",
    "Marsaxlokk",
    "Kirkop",
    "Gudja",
    "Tarxien",
    "Santa Lucija",
    "Fgura",
    "Bormla",
    "Birgu",
    "Xghajra",
    "Msida",
    "San Gwann",
    "Iklin",
    "Birkirkara",
    "GharGhur",
    "Pembroke",
    "St. Julian's",
    "Valletta",
    "Paola",
    "Marsa",
    "Hamrun",
    "Floriana",
    "Pieta",
    "Santa Venera",
    "Qormi"
    ];
    
    useEffect(() => {   
        if (townFilter.length === 0) {
            return;
        }

        const mainLoader = async () => {
            await globalGetPollutantData();
        }

        mainLoader();
        
    }, [townFilter, pollutantFilter, monthRange]);


 
    const globalGetPollutantData =  async () => {

        const res = await axios.post('/getPollutantVolTowns/' , {"towns" : townFilter});

        const rawData = res.data;
        

        townFilter.forEach(town => {
            processPollutantData(town, rawData[town]);
        })

        setTimeout(() => {
            setLoading(false);
        }, 2000);
    
            
        

    }

    const processPollutantData = (town, input) => {
            if (!input){
                return;
            }

            // Contain Pollutant Data
            let dataset = []
            // Contain Dates data 
            let datedataset = []
    
            let polReading;
    
            // Filter data by month range 
            if(monthRange) {
    
                polReading = input.filter(set => {
                    const date = new Date(set['day']);
                    // console.log(`${date.getMonth()} compared to ${yearRange}`)
                    return monthRange[0] <= date.getMonth() && date.getMonth() <= monthRange[1];
                })
    
    
            }
            
            polReading.map( (set, index) => {
                // tempSet of 'row'
                let tempSet = {}
                // Retain Date of row
                tempSet["date"] = set['day']
                // Get each pollutant reading of current row
                pollutantFilter.map( (pol ,indx) => {
                    
                    tempSet[pol] = set[pollutantDBKeyMap[pol]];
                    
                })
                // push onto list of dataset
                dataset.push(tempSet);
            })
            
            // Push current row date onto date dataset list
            dataset.map(d => {
                datedataset.push(new Date(d.date));
            })
    
    
            let tempDataSet = []
    
            // Apply display filter 
            pollutantFilter.map((pol) => {
                let tempSet = {}
                tempSet['label'] = pol;
                tempSet['data'] = dataset.map(d => d[pol] ?? null);
                tempSet['color'] = pollutantColors[pol];
                // console.log("TEMP SET BEING PUSHED: " + JSON.stringify(tempSet));
                tempDataSet.push(tempSet);
            });

            let object = {DisplayData: tempDataSet, YearlyData: datedataset }


            setGlobalData(prev => ({...prev,
                                    [town] : object}));
    
    
        }

    const checkActivePollutant = (pol) =>{
        return pollutantFilter.includes(pol);
    }

    const checkActiveTown = (town) => {
        return townFilter.includes(town);
    }

    const applyTown = (town) => {
        setLoading(true);
        setGlobalData({}); 
        if (!checkActiveTown(town)) {
            setTownFilter(prev => [...prev, town])
        }else{
            setTownFilter(prev => [...prev.filter(x => town!== x)])
        }
    }

    const applyPollutant = (pol) => {
        if ( graphView == 1) {
            setPollutantFilter([pol])
            return;
        }

        if (!checkActivePollutant(pol)) {
            setPollutantFilter(prev => [...prev, pol])
        }else{
            setPollutantFilter(prev => [...prev.filter(x => pol !== x)])
        }
    }

    const renderGraphingContent = () => {
        if (graphView === 1){
            const tempData = globalData;
            return <TownOverviewDashboardCombined pollutant={pollutantFilter[0]} data={globalData} YearlyData={globalData[Object.keys(globalData)[0]]?.YearlyData || []}/>
        } else {
            return townFilter.map((town) => {
                const data = globalData[town];
                if (!data) {
                    return null;
                }
                return <TownOverviewDashboard  town={town} data={globalData[town]["DisplayData"]} dateData={globalData[town]["YearlyData"]}/>
            })
        }
    }

 
    return(
        <div className={"statistics-monitor-main"}>
            <h1>Statistics Dashboard</h1>
            <hr></hr>
            <br></br>
            <div className={"dashboard-filters"}>
                <button  style={ graphView === 0 ? {backgroundColor : "orange"} : {backgroundColor : "#1f1f1f"}} className={graphView === 0 ? "dsh-btn active" : "dsh-btn"} onClick={() => setGraphView(0) }>Divided Graphs</button>
                <button style={ graphView === 1 ? {backgroundColor : "orange"} : {backgroundColor : "#1f1f1f"}} className={graphView === 1 ? "dsh-btn active" : "dsh-btn"} onClick={() => setGraphView(1) && setPollutantFilter([])}>Combined Graphs</button>    
            </div>
            <br></br>
            <ul className={'dashboard-filters'}>
                {pollutants.map((e, index) => 
                    <li key={index} style={ checkActivePollutant(e) ? {backgroundColor : pollutantColors[e]} : {backgroundColor : "#1f1f1f"}} className={checkActivePollutant(e) ? 'dsh-btn active' : 'dsh-btn'}>
                        <button onClick={() => applyPollutant(e)}>{e}</button>
                    </li>
                )}
            </ul>
            <br></br>
            <div className={"dashboard-towns"}>
                <div className={'dashboard-town-filter-container'}>
                    <h2>Towns Displayed</h2>
                    <ul className={'dashboard-town-filter'}>
                    {townNames.map((e, index) => 
                        <li key={index}  className={checkActiveTown(e) ? 'dsh-city-btn active' : 'dsh-city-btn'}>
                            <button disabled={isLoading} onClick={() => { applyTown(e);} }>{e}</button>
                        </li>
                    )}
                    </ul>
                </div>
                <div className={'town-dashboards-container'}>
                    { !isLoading && globalData != null ?  renderGraphingContent() : <h1>Loading</h1> }
                </div>
            </div>
            <div className={'year-range-filter'}>
                    <Slider
                        min={0}
                        max={11}
                        step={1}
                        value={monthRange}
                        onChange={(e, v) => setMonthRange(v)}
                        className="year-range-input"
                        marks={marks}
                        sx={{
                            "& .MuiSlider-mark": {
                            backgroundColor: "white",
                            height: 8,
                            width: 2,
                            },
                            "& .MuiSlider-markLabel": {
                            color: "white",
                            fontSize: "0.75rem",
                            },
                        }}
                    />
            </div>

            
            {townFilter.length != 0 && !isLoading ? <TownPollutantBoard towns={townFilter}/> : null}



        </div>
    )
}