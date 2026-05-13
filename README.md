

# Pollution Monitoring For Maltese Localities

This is a submission repository for a pollution monitoring application for health appliances. 

## Setup Guide

To Setup this application, you must first instantiate a MySQL database onto your local machine, keep note of 
the user credentials to access the database. The default user "root" can be used. The most important variables are the port 
where the database is hosted, the root user password and the database name.

Inside the backend directory, there is a ```.env``` file which you then need to then fill in the necessary credentials.

Once your local MySQL is setup, a dump.sql is provided within the DatabaseFiles folder, simply run the command whilst in the directory.

```bash
mysql -u root -p mydb < dump.sql
```

If necessary, a separate Pollutants.sql file containing data inserts is included.


## Populating The Database
The ```Server.py``` is implemented with interpolating methods in order to extrapolate known pollution readings to estimate unrecorded towns. 

Any Data at the moment that is acquired must be in the format of a ```.xlsx``` file, and must be inserted within the ```Datasets``` folder inside the ```backend``` directory.

Once inserted, the ```Server.py``` file must be ammended to switch the ```interpolate``` parameter to True

Like So; 

```python

    # ================= RUN =================
    server = APIServer(interpolate=True, stations_only=False)
    app = server.app

```

If you simply wish to just populate the database with the readings provided, simply keep this false, and ```stations_only``` set to true. If both variables are false, no data will be processed.

Please do note however that if multiple datasets are to be used, ensure no collisions between the data on the date period they are recorded. This may hinder performance and cause visual bugs.


## Running Guide

To run this application you will require two terminals to run both the frontend and the backend.

### Frontend
On your terminal, cd to the frontend directory and run 
```cmd
npm install
```
To install the necessary dependencies 

After which, on the terminal you can run the react application using

```cmd
npm start
```

### Backend
On your terminal, cd to the backend directory and run 
```cmd
pip install -r requirements.txt
```

To install the necessary dependencies.
After which, on the terminal you can run the FastAPI application

```cmd
fastapi run Server.py
```

Note: If you require a virtual environment, you can activate that and run the same procedures as above.

### It is imperative that the backend application is running on Port 8000.
If it comes to be that the port cannot be run on 8000, please do take note of it and adjust it to
the ```proxy``` variable in the package.json file of the ```pyprojectreact``` frontend folder.

Like so...
```json
"proxy" : "http://localhost:port"
```

