/**
 *  Primary file for the API
 *
 *
 *
 */

// Dependencies
const http = require('http');
const url = require('url');

// The server should respond to all requests with a string
const server = http.createServer(function(req, res) {

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path of url
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g,'')

  //Get the query string as object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Send the response
  res.end('Hello world \n');

  // Log the request path
  console.log(`Request received on path: ${trimmedPath} with method: ${method} and with theese query string parameters: `)
  console.log(queryStringObject)

})

//Start the server, and have it listen on port 3000
server.listen(3000,function() {
  console.log('The server is listening on port 3000 now')
})
