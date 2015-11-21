"use strict";
/**
 * Note: in this test, we are loading all the fixture routes as well,
 * to simulate a more real-world example.
 */

var routes = require('../fixtures/routes');
var ExpressDriver = require('../../src/drivers/ExpressDriver');
var ScenicRoute = require('../../src/factory')({
    Driver: ExpressDriver
});

var route = routes(ScenicRoute);

route.get('/hello-world', function(req, res) {

    res.end('hello, world!');
});

ScenicRoute.startServer(1337, function(server) {

    console.log('listening on port '+1337);
});
