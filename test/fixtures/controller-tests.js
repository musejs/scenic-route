"use strict";
var fs = require('fs');
var path = require('path');
var http = require('http');
var request = require('supertest');
var should = require('should');

module.exports = function(requestHandler) {


    it('should route to controller route 1', function(done) {

        request(requestHandler)
            .get('/controller-route-1/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('hi');
                done();
            });
    });

    it('should route to controller route 2', function(done) {

        request(requestHandler)
            .get('/controller-route-2/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('/controller-route-2/greeting?addition=yo');
                done();
            });
    });

    it('should route to controller route 3', function(done) {

        request(requestHandler)
            .get('/controller-route-3/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('sup');
                done();
            });
    });

    it('should route to controller route 4', function(done) {

        request(requestHandler)
            .get('/controller-route-4/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('howdy');
                done();
            });
    });

    it('should route to controller [get] route 5', function(done) {

        request(requestHandler)
            .get('/controller-group/controller-route-5/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('hola');
                done();
            });
    });

    it('should route to controller [post] route 5', function(done) {

        request(requestHandler)
            .post('/controller-group/controller-route-5/another-greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('aloha');
                done();
            });
    });

    it('should route to controller route 6', function(done) {

        request(requestHandler)
            .post('/controller-group/controller-route-6')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('bro');
                done();
            });
    });


    it('should route to controller route 7', function(done) {

        request(requestHandler)
            .get('/controller-route-7/namaste/greeting')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('namaste');
                done();
            });
    });

    it('should route to controller route 8', function(done) {

        request(requestHandler)
            .get('/controller-route-8/greeting/namaste')
            .expect(200)
            .end(function(err, res){

                if (err) {
                    throw err;
                }
                res.text.should.equal('namaste');
                done();
            });
    });

};
