/**
 *
 * Homework 1. Hello World API
 *
 * Details:
 *
 * Please create a simple "Hello World" API. Meaning:
 * 1. It should be a RESTful JSON API that listens on a port of your choice.
 * 2. When someone sends an HTTP request to the route /hello, you should return a welcome message, in JSON format. This message can be anything you want.
 */

// Constants for homework
const PORT = 3000;

// Dependencies
const http = require('http');
const url = require('url');

// Setup handlers
const handlers = {
  hello(data, callback) {
    callback(200, {greeting: 'Nice to see you!'});
  },
  notFound(data, callback) {
    callback(404);
  }
}

// Setup router
const router = {
  'hello': handlers.hello
}

// Init the server
const httpServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')
  const chosenHandler = typeof(router[trimmedPath]) !== 'undefined'
    ? router[trimmedPath]
    : handlers.notFound;

  chosenHandler({}, (statusCode, payload) => {
    const payloadString = JSON.stringify(payload);
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(statusCode);
    res.end(payloadString);
  })
})

// Start the server
httpServer.listen(PORT, function () {
  console.log(`The server is listening on port ${PORT} now`);
})
