

// Used for Graph / Interface coloring associated with pollutant
export const pollutantColors = {
    'SO2': "#f5d142",
    'NO' : "#b8c916",
    'NO2': "#1652c9",
    'PM25': "#c92e16",
    'PM10': '#96000d',
    'O3': "#bf00ff"
};

export const diseases = [
    "RES",
    "CVD",
    "LUNGC",
    "COPD",
    "IHD"
]

export const diseaseNames = {
    "RES" : "Respiratory Disease",
    "CVD" : "Cardiovascular Disease",
    "LUNGC" : "Lung Cancer",
    "COPD" : "Chronic Obstructive Pulmonary Disease",
    "IHD" : "Isachemic Heart Disease"
}

// Limits are in ug/m^3
export const WHOThresholds = {
    "SO2" : 40,
    "NO2" : 40,
    "PM10" : 15,
    "PM25" : 5,
    "CO2" : 4,
    "O3": 60
}
// Keywords for pollutants
export const listofPollutants = [
    "SO2",
    "NO2",
    "PM10",
    "PM25",
    "O3"
]

// Relative Risks sourced by HRAPIE-2 (WHO)

// Chronic Obstructive Pulmonary Disease (COPD)
export const COPD_RR = {
    "PM25" : 1.14,
    "PM10" : 1.22,
    "NO2" : 1.04
}
// Lung Cancer
export const LUNGC_RR = {
    "PM25" : 1.09,
    "PM10" : 1.10,
    "NO2" : 1.07
}
// Ischemic Heart Disease
export const IHD_RR = {
    "PM25" : 1.14,
    "PM10" : 1.06,
    "NO2" : 1.05
}

// Annual Relative Risks of Mortality for long-term exposure to pollutants CVD 
export const globalRR_CVD = {
        "PM25" : 1.13,
        "PM10" : 1.08,
        "NO2" : 1.05,
    }

// Annual Relative Risks of Mortality for long-term exposure to pollutants Respiratory Disease
export const globalRR_RES ={
        "PM25" : 1.14,
        "PM10" : 1.12,
        "NO2" : 1.05,
        "O3": 1.05 
    }


export const polAcronymNameMap = {
    "SO2" : "Sulfur Dioxide",
    "NO2" : "Nitrogen Dioxide",
    "PM10" : "Particulate Matter 10",
    "PM25" : "Particulate Matter 2.5",
    "NO" : "Nitric Oxide",
    "O3" : "Ozone"
}

export const pollutantNameKeyMap = {
    "so_ugm3" : "Sulfur Dioxide",
    "no2_ugm3" : "Nitrogen Dioxide",
    "pm10_ugm3" : "Particulate Matter 10",
    "pm25_ugm3" : "Particulate Matter 2.5",
    "no_ugm3" : "Nitric Oxide",
    "o_ugm3" : "Ozone"
}
export const pollutantDBKeyMap = {
    "SO2" : "so_ugm3",
    "NO2" : "no2_ugm3",
    "PM10" : "pm10_ugm3",
    "PM25" : "pm25_ugm3",
    "NO": "no_ugm3",
    "O3" : "o_ugm3"
}

export const pollutantLimits24Hr = {
    "SO" : 40,
    "NO2" : 25,
    "PM10" : 50,
    "PM25" : 25,
    "CO2" : 4,
    "O3": 100
}


export const PollutionLevelColorGrade = (pol, lim) => {
    const weight = (pol / lim) * 100;

    if (weight < 33){
        return [0, 255, 0, 120]; // Green
    } else if (weight < 66) {
        return [255, 255, 0, 120]; // Yellow
    } else {
        return [255, 0, 0, 120]; // Red
    }

}