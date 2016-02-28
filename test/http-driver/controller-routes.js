"use strict";

var express = require('express');

describe('HttpDriver', function() {

    describe('controller routes', function() {

        var ScenicRoute = require('../../src/factory')();

        var routes = require('../fixtures/controller-routes');
        var route = routes(ScenicRoute);

        require('../fixtures/controller-tests')(ScenicRoute.requestHandler());
    });

});
