'use strict'

const Joi = require('@hapi/joi')
const assert = require('assert');
const Boom = require('@hapi/boom')


const handleError = function (request, h, err) {

  if (err.isJoi && Array.isArray(err.details) && err.details.length > 0) {
    const invalidItem = err.details[0];
    let errorPayload = { "statusCode": 400, "error": "Bad Request", "message": "Invalid request payload input", "details": err.details }
    return h.response(errorPayload).type('application/json')
      .code(400)
      .takeover();
  }

  return h.response(err)
    .takeover()
};

const createResponse = function (obj, includeCode = true) {
  let response = {}
  response.name = obj.name;
  response.description = obj.description;
  response.type = obj.type;
  if (includeCode) {
    response.code = obj.code;
    response.url = obj.url;
  }
  return response;

}

const plugin = {
  name: 'organization',
  version: '1.0.0',
  register: (server, options) => {
    server.route([
      {
        method: 'GET',
        path: '/api/organization/{code}',
        handler: async (request, h) => {

          const code = request.params.code
          const db = server.app.db;

          let organization;
          try {
            organization = await db.collection('organizations').findOne({ code: code });
          } catch (err) {
            console.error(err)
          }

          if (organization == null) {
            return Boom.notFound(`Organization with code "${code}" not found`);
          }

          return h.response(createResponse(organization)).type('application/json');
        },
        options: {
          tags: ['api'],
          validate: {
            params: Joi.object({
              code: Joi.string()
            })
          }
        }
      },
      {
        method: 'GET',
        path: '/api/organization',
        handler: async (request, h) => {

          let name = request.query.name;
          let code = request.query.code;
          let query = {}

          if (name != null) {
            query['name'] = name;
          }

          if (code != null) {
            query['code'] = code;
          }

          const db = server.app.db;

          let organizations;
          try {
            organizations = await db.collection('organizations').find(query).toArray();
          } catch (err) {
            console.error(err)
          }
          return h.response(organizations.map(e => createResponse(e, code != null))).type('application/json');
        },
        options: {
          tags: ['api'],
          validate: {
            query: Joi.object({
              code: Joi.string(),
              name: Joi.string()
            })
          }
        }
      },
      {
        method: 'POST',
        path: '/api/organization',
        handler: async (request, h) => {

          let payload = request.payload;

          const db = server.app.db;

          const organizationByCode = await db.collection('organizations').find({ code: payload.code }).toArray();

          if (organizationByCode.length > 0) {
            return Boom.badRequest(`Item with code "${payload.code}" already exists`);
          }

          let r = await db.collection('organizations').insertOne(payload);
          assert.equal(1, r.insertedCount);

          return h.response(createResponse(payload)).code(201);
        },
        options: {
          tags: ['api'],
          validate: {
            payload: Joi.object({
              name: Joi.string().min(3).required(),
              description: Joi.string().max(512).required(),
              url: Joi.string().uri().required(),
              code: Joi.string().required(),
              type: Joi.string().valid('employer', 'insurance', 'health system').required()
            }),
            failAction: handleError
          },
        }
      },
      {
        method: 'PUT',
        path: '/api/organization/{code}',
        handler: async (request, h) => {

          const code = request.params.code
          let payload = request.payload;

          const db = server.app.db;

          let r = await db.collection('organizations').findOneAndUpdate(
            { code: code },
            {
              $set:
              {
                name: payload.name,
                description: payload.description,
                url: payload.url,
                type: payload.type
              }
            }, {
            returnOriginal: false,
            upsert: false
          });

          if (r.value == null) {
            return Boom.notFound(`Organization with code "${code}" not found`);
          }

          return h.response(createResponse(r.value)).code(200);
        },
        options: {
          tags: ['api'],
          validate: {
            payload: Joi.object({
              name: Joi.string().min(3).required(),
              description: Joi.string().max(512).required(),
              url: Joi.string().uri().required(),
              type: Joi.string().valid('employer', 'insurance', 'health system').required()
            }),
            params: Joi.object({
              code: Joi.string()
            }),
            failAction: handleError
          },
        }
      },
      {
        method: 'DELETE',
        path: '/api/organization/{code}',
        handler: async (request, h) => {

          const code = request.params.code
          let payload = request.payload;

          const db = server.app.db;

          let r = await db.collection('organizations').findOneAndDelete({ code: code });

          if (r.value == null) {
            return Boom.notFound(`Organization with code "${code}" not found`);
          }

          return h.response(createResponse(r.value)).code(200);
        },
        options: {
          tags: ['api'],
          validate: {
            params: Joi.object({
              code: Joi.string()
            })
          }
        }
      }])
  }
}

module.exports = plugin
