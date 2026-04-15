import React from 'react';
import '../../Stylesheets/filters.css';
import { polAcronymNameMap, diseaseNames} from '../Backend/PollutionInfo';

export default function FiltersInputDiseaseRisk({ data, setData }) {

  const changeData = (value, disease, pollutant) => {
    setData(prev => {
      const newData = { ...prev };
      newData[disease][pollutant] = value;
      return newData;
    });
  };

  // Collect all pollutants across diseases for table headers
  const allPollutants = Array.from(
    new Set(
      Object.values(data)
        .flatMap(pollutants => Object.keys(pollutants))
    )
  );

  return (
 
    <table className="filter-table">
      <thead>
        <tr>
          <th>Disease</th>
          {allPollutants.map(pollutant => (
            <th key={pollutant}>{polAcronymNameMap[pollutant] || pollutant}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([disease, pollutants]) => {

            return (

            <tr key={disease}>
            <td>{diseaseNames[disease]}</td>
            {allPollutants.map(pollutant => (
                <td key={pollutant}>
                    <input
                    type="number"
                    value={pollutants[pollutant] ?? 0}
                    onChange={(e) =>
                        changeData(parseFloat(e.target.value), disease, pollutant)
                    }
                    />
                </td>
            ))}
          </tr>
            )
        }
        
        
            

        )}
      </tbody>
    </table>
  );
}