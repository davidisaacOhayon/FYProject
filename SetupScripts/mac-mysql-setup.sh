# This script requires homebrew in order to run.


# Install mysql and run the service
# brew install mysql

# brew services start mysql

# Default user is root.

# connect to mysql servic
mysql -u root -p

CREATE USER 'fyadmin'@'localhost' IDENTIFIED BY 'SuperPassword123';

GRANT ALL PRIVILEGES ON *.* TO 'newuser'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE mydb;
USE mydb;



CREATE TABLE Pollutants(
    id int AUTO_INCREMENT PRIMARY KEY,
    name varchar(50),
    no_ugm3 DOUBLE,
    no2_ugm3 DOUBLE,
    so_ugm3 DOUBLE,
    o_ugm3 DOUBLE,
    pm10_ugm3 DOUBLE,
    pm25_ugm3 Double,
    day DATE
)


