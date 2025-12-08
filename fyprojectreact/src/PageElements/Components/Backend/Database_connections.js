import axios from 'axios'




export async function getTownPollution(town){

    try {
        const res =  axios.get(`http://localhost:8000/getPollutantVolTown/?town=${town}`)
        return res.data;
    }catch (err){
        return null;
    }

 


}