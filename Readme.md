# RESTful JSON using Hapi with docker for organization resource Sample

## Running local with npm

You can run it locally with `npm i` and then `npm start` (you need a local mongo listening in port 27017) and connecting to http://localhost:3000/.
You can run a mongo local with docker using `docker-compose up mongod` 

## Running with docker

You can run it with docker using:

`docker-compose build`

`docker-compose up`

and connecting to http://localhost:3000/

## API Documentation

API Documentation is available in swagger http://localhost:3000/documentation#/api

## Test

For testing, with a mongo instance running, use `npm test`