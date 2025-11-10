# NOTE: This script requires homebrew to be installed in order for the database to be instantiated.

Brew install postgres

# Make database directory
mkdir -p ~/postgres/data3  

# Initiate Database
initdb -D ~/postgres/data3  

# Start server at port 5433
pg_ctl -D ~/postgres/data3 -l ~/postgres/data3/logfile -o "-p 5433" start

# Create super user
export PGPORT=5433
createuser -s postgres

# Connect to DB
psql -p 5433 -U postgres 

# Create DB
CREATE DATABASE FYDB owner postgres;




