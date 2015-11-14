"use strict";
/**
 * Note: in this test, we are loading all the fixture routes as well,
 * to simulate a more real-world example.
 */

var routes = require('../fixtures/routes');
var ScenicRoute = require('../../src/factory')();

var route = routes(ScenicRoute);

route.get('/hello-world', function(req, res) {

    res.end('hello, world!');
});

ScenicRoute.startServer(1337, function(err, server) {

    console.log('listening on port '+1337);
});