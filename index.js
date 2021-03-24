/**
 *  Primary file for the API
 *
 *
 *
 */

// Dependencies
const http = require('http');
const url = require('url');
const {StringDecoder} = require('string_decoder')

// The server should respond to all requests with a string
const server = http.createServer(function (req, res) {

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
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // Log the request path
    console.log(`Request received on path: ${trimmedPath} with method: ${method} and with theese query string parameters: `)
    console.log(queryStringObject)
    console.log('Request received with these headers')
    console.log(headers)
    console.log(`Request received with payload: ${buffer}`)
  });

  // Choose the handler the request should go to. If no one found choose notFound handler.
  const chosenHandler = typeof(router[trimmedPath]) !== undefined
    ? router[trimmedPath]
    : router.notFound;

  //  Construct data object to send to the handler
  const data = {
    trimmedPath,
    queryStringObject,
    method,
    headers,
    'payload': buffer
  }

  //  Route the request to the handler specified in the router
  chosenHandler(data, function(statusCode, payload) {
    //  Use the status code called back by the handler, or default to 200
    statusCode = typeof(statusCode) === 'number'
      ? statusCode
      : 200;

    // Use the payload called back by the handler, or default to empty object
    payload = typeof(payload) === 'object'
      ? payload
      : {}

    //  Convert the payload to a string
    const paylodString = JSON.stringify(payload);

    // Return the responce
    res.writeHead(statusCode);
    res.end(paylodString);

  })
})

//Start the server, and have it listen on port 3000
server.listen(3000, function () {
  console.log('The server is listening on port 3000 now')
})

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = function(data, callback){
  //Callback a http status code, and a payload object
  callback(406, {name:'sample handler'})
};

//Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};


// Define a request router
const router = {
  'sample': handlers.sample
}
