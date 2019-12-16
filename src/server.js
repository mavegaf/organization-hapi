'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const OS = require("os");
const MongoClient = require('mongodb').MongoClient;
const Pkg = require("../package.json");


const init = async () => {

    let hostname;
    let url;

    console.log(`ENV:${process.env.ENV}`);
    if (process.env.ENV == 'production') {
        url = 'mongodb://mongodb:27017/organization_data';
        hostname = OS.hostname()
    } else if (process.env.ENV == 'test') {
        url = 'mongodb://localhost:27017/organization_test_data';
        hostname = 'localhost'
    } else {
        url = 'mongodb://localhost:27017/organization_data';
        hostname = 'localhost'
    }

    console.log(`url:${url}`);
    console.log(`hostname:${hostname}`);

    const server = Hapi.server({
        port: 3000
    });

    const swaggerOptions = {
        info: {
            title: 'API Documentation',
            version: Pkg.version,
        },
    };

    const client = new MongoClient(url, {  useUnifiedTopology: true });
    await client.connect();
    
    const db = client.db();
    server.app.db = db;
    
    console.log("Connected to mongo");


    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
          return 'Organization app is up and running.'
        }
      })

    await server.register([
        require('./api/organization'),
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }])

    try {
        if (!module.parent) {
            await server.start();
        } 
        else {
            await server.initialize();
        }
        console.log('Server running on %s', server.info.uri);
        return server;
    } 
    catch (error) {
        console.error(error);
        process.exit(1);
    }
    
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

void async function () {
    if (!module.parent) {
        await init();
    }
}();

module.exports = {
    init
}
