import axios from 'axios'




export async function getTownPollution(town){

    try {
        const res =  axios.get(`http://localhost:8000/getPollutantVolTown/?town=${town}`)
        return res.data;
    }catch (err){
        return null;
    }

}

export async function getTownClusters(pol){

    try {
        const res = axios.get(`http://localhost:8000/getTownExpPolClusters?pollutant=${pol}`)
        console.log("Got data")
        console.log(res)
        return res.data;
    } catch ( err ) {
        console.log(err)
        return null;
    }

}