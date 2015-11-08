"use strict";
var should = require('should');

describe('ScenicRoute', function() {

    describe('constructor', function () {

        it('should create a new instance of ScenicRoute', function () {

            var ScenicRoute = require('../src/factory')();

            var route = ScenicRoute.make();

            route.should.be.instanceOf(ScenicRoute);
        });
    });

});