"use strict";

describe('ExpressDriver', function() {

    describe('controller routes', function() {

        var express = require('express');
        var app = express();

        var ExpressDriver = require('../../src/drivers/ExpressDriver');
        ExpressDriver.express(app);
        var ScenicRoute = require('../../src/factory')({
            Driver: ExpressDriver
        });

        var routes = require('../fixtures/controller-routes');
        var route = routes(ScenicRoute);

        require('../fixtures/controller-tests')(ScenicRoute.requestHandler());
    });

});
