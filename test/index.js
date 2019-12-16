'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('./../src/server');
let server;

// test shortcuts
const { expect } = Code;
const { after, before, describe, it } = exports.lab = Lab.script();

const mockOrganizations = [
    {
        "name" : "Employer 1",
        "description": "some description employer 1",
        "url": "http://someemployer.com/1",
        "code": "AAAA",
        "type": "employer"
    },
    {
        "name" : "Insurance",
        "description": "some description insurance",
        "url": "http://someinsurance.com",
        "code": "AAAB",
        "type": "insurance"
    },
    {
        "name" : "Health system 1",
        "description": "some description health 1",
        "url": "http://somehealth.com/1",
        "code": "AAAC",
        "type": "health system"
    }
]

const mockOrganizationsNoCode = [
    {
        "name" : "Employer 1",
        "description": "some description employer 1",
        "type": "employer"
    },
    {
        "name" : "Insurance",
        "description": "some description insurance",
        "type": "insurance"
    },
    {
        "name" : "Health system 1",
        "description": "some description health 1",
        "type": "health system"
    }
]

async function cleanDatabase(db) {
    
    await db.collection('organizations').deleteMany({});
}

describe('Organization hapi API', () => {

    before(async () => {
        process.env.ENV = 'test';

        server = await Server.init();
        const db = server.app.db;

        // clean DB
        await cleanDatabase(db);

        // insert test data
        await db.collection('organizations').insertMany(JSON.parse(JSON.stringify(mockOrganizations)));
    });

    after(async () => {

        if (!server) {
          return;
        }
    
        await server.stop();
    });

    it('GET /api/organization', async () => {

        const response = await server.inject({
            method: 'GET',
            url: '/api/organization'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal(mockOrganizationsNoCode);
    });

    it('GET /api/organization with code', async () => {

        const response = await server.inject({
            method: 'GET',
            url: '/api/organization?code=AAAB'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal([mockOrganizations[1]]);
    });

    it('POST /api/organization add new', async () => {
        let payload = {
            "name" : "Employer 2",
            "description": "some description employer 2",
            "url": "http://someemployer.com/2",
            "code": "AAAD",
            "type": "employer"
        };

        const response = await server.inject({
            method: 'POST',
            url: '/api/organization',
            payload: payload
        });

        expect(response.statusCode).to.equal(201);
        expect(response.result).to.equal(payload);
    });

    it('POST /api/organization code unique', async () => {
        let payload = {
            "name" : "Employer repeated",
            "description": "some description employer repeated",
            "url": "http://someemployer.com/repeated",
            "code": "AAAA",
            "type": "employer"
        };

        const response = await server.inject({
            method: 'POST',
            url: '/api/organization',
            payload: payload
        });

        expect(response.statusCode).to.equal(400);
    });

    it('POST /api/organization invalid url', async () => {
        let payload = {
            "name" : "Employer repeated",
            "description": "some description employer repeated",
            "url": "this is not a url",
            "code": "AAAA",
            "type": "employer"
        };

        const response = await server.inject({
            method: 'POST',
            url: '/api/organization',
            payload: payload
        });

        expect(response.statusCode).to.equal(400);
    });

    it('GET /api/organization/AAAA', async () => {

        const response = await server.inject({
            method: 'GET',
            url: '/api/organization/AAAA'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal(mockOrganizations[0]);
    });

    it('PUT /api/organization/AAAA', async () => {

        let payload = {
            "name" : "Employer 1",
            "description": "some description employer 1 edited",
            "url": "http://someemployer.com/1",
            "type": "employer"
        };
    
        const response = await server.inject({
            method: 'put',
            url: '/api/organization/AAAA',
            payload: payload
        });
    
        let organization = await server.app.db.collection('organizations').findOne({ code: "AAAA" });
        expect(response.statusCode).to.equal(200);
        expect(organization.description).to.equals("some description employer 1 edited");

    it('DELETE /api/organization/AAAA', async () => {

        const response = await server.inject({
            method: 'DELETE',
            url: '/api/organization/AAAA'
        });

        expect(response.statusCode).to.equal(200);
        let organization = await server.app.db.collection('organizations').findOne({ code: "AAAA" });
        expect(organization).to.be.null();
    });


   
});



});