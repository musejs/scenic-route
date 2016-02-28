"use strict";

describe('HttpDriver', function() {

    describe('basic routes', function() {

        var ScenicRoute = require('../../src/factory')();

        var routes = require('../fixtures/routes');
        var route = routes(ScenicRoute);

        require('../fixtures/tests')(ScenicRoute.requestHandler());
    });

});
