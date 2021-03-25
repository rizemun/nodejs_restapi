/**
 *  Primary file for the API
 *
 *
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const {StringDecoder} = require('string_decoder')
const fs = require('fs')
const config = require('./lib/config');
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// Instantiate the HTTP server
const httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
})

// Start the HTTP server
httpServer.listen(config.httpPort, function () {
  console.log(`The server is listening on port ${config.httpPort} in ${config.envName} mode now`);
})

// Instantiate the HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
})

// Start the HTTP server
httpsServer.listen(config.httpsPort, function () {
  console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} mode now`);
})

// All the server logic for both the http and https server
const unifiedServer = function (req, res) {

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path of url
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an objects
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    // Log the request path
    /*console.log(`Request received on path: ${trimmedPath} with method: ${method} and with these query string parameters: `)
    console.log(queryStringObject)
    console.log('Request received with these headers')
    console.log(headers)
    console.log(`Request received with payload: ${buffer}`)
*/
    // Choose the handler the request should go to. If no one found choose notFound handler.
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound;

    // Construct data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    //  Route the request to the handler specified in the router
    chosenHandler(data, function (statusCode, payload) {
      //  Use the status code called back by the handler, or default to 200
      statusCode = typeof (statusCode) === 'number'
        ? statusCode
        : 200;

      // Use the payload called back by the handler, or default to empty object
      payload = typeof (payload) === 'object'
        ? payload
        : {}

      //  Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
}

// Define a request router
const router = {
  'ping': handlers.ping,
  'users': handlers.users
}
