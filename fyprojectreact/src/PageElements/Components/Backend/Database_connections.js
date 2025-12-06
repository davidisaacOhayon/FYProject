import axios from 'axios'




export function getTownPollution(town){
    let response; 

    axios.get(`http://localhost:8000/getPollutantVolTown/?town=${town}`)
    .then(res => {
        response = res.data})
    .catch(err => {})

    return response;
    
}