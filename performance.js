"use strict";

var randomWords = require('random-words');
var express = require('express');
var ScenicRoute = require('./src/factory')();
var body_parser = require('body-parser');

function ok(req, res) {

    res.end('ok');
}

function greeting(req, res) {

    res.end(req.params['greeting']);
}

var scenic_routes =  [];
var express_routes = [];

for(var x = 0; x < 50; x++) {

    let uri = randomWords({exactly: 2, join: '-'});

    uri+= '/'+randomWords({exactly: 2, join: '-'});

    if (x % 2) {
        let param = randomWords();

        scenic_routes.push(uri + '/{'+param+'}');
        express_routes.push(uri + '/:'+param);
    } else {
        scenic_routes.push(uri);
        express_routes.push(uri);
    }
}

var route = ScenicRoute.make({
    middleware: [body_parser.json(), body_parser.urlencoded({extended: true})]
});

var express_route = express();
express_route.use(body_parser.json(), body_parser.urlencoded({extended: true}));

scenic_routes.forEach(function(uri) {

    route.get(uri, ok);
});

express_routes.forEach(function(uri) {

    express_route.get(uri, ok);
});

route.get('/hello/{greeting}', greeting);
express_route.get('/hello/:greeting', greeting);

route.get('/', ok);
express_route.get('/', ok);

ScenicRoute.startServer(3000, function(server) {

    console.log('Scenic Route listening on 3000.');
});

express_route.listen(8000, function(server) {

    console.log('Express listening on 8000.');
});