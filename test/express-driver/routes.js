"use strict";

var fs = require('fs');
var path = require('path');
var http = require('http');
var should = require('should');
var request = require('supertest');
var express = require('express');

describe('ExpressDriver', function() {

    describe('basic routes', function() {

        var app = express();
        var routes = require('../fixtures/routes');
        var ExpressDriver = require('../../src/drivers/ExpressDriver');
        ExpressDriver.express(app);
        var ScenicRoute = require('../../src/factory')({
            Driver: ExpressDriver
        });

        before(function() {

            var route = routes(ScenicRoute);
            app = http.createServer(ScenicRoute.requestHandler());
        });

        it('should route to the root with ok', function(done) {

            request(app)
                .get('/')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should not route to the root', function(done) {

            request(app)
                .post('/')
                .expect(404, done);
        });

        it('should route to route 1 with ok', function(done) {

            request(app)
                .get('/route-1')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });

        });

        it('should route to route 2 with ok', function(done) {

            request(app)
                .get('/route-2')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });

        });

        it('should not route to route 3', function(done) {

            request(app)
                .get('/route 3')
                .expect(404, done);

        });

        it('should route to route 4 and 5 with ok', function(done) {

            request(app)
                .get('/route-4/route-5')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });

        });

        it('should not route to route 5', function(done) {

            request(app)
                .post('/route-5')
                .expect(404, done);
        });

        it('should route to route 6, 7, and 8 with ok', function(done) {

            request(app)
                .get('/route-6/route-7/route-8')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });

        });

        it('should not route to route 6 and 7', function(done) {

            request(app)
                .post('/route-6/route-7')
                .expect(404, done);

        });

        it('should not route to route 7', function(done) {

            request(app)
                .post('/route-7')
                .expect(404, done);

        });

        it('should not route to route 7 and 8', function(done) {

            request(app)
                .post('/route-7/route-8')
                .expect(404, done);

        });

        it('should route to route dot with ok', function(done) {

            request(app)
                .get('/routedot.')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route dot 2 with ok', function(done) {

            request(app)
                .get('/routedot.2')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route slash with ok', function(done) {

            request(app)
                .get('/routeslash')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route slash 2 with ok', function(done) {

            request(app)
                .get('/routeslash2')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 9 with ok', function(done) {

            request(app)
                .get('/route-9')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 10 with ok', function(done) {

            request(app)
                .get('/route-10')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 11 with middleware response', function(done) {

            request(app)
                .get('/route-11')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('middleware_1');
                    done();
                });
        });

        it('should route to route 12 with middleware response', function(done) {

            request(app)
                .get('/route-12')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('middleware_1|middleware_2');
                    done();
                });
        });

        it('should route to route 13 with thing', function(done) {

            request(app)
                .get('/route-13/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('hello');
                    done();
                });
        });

        it('should route to route 14 with thing', function(done) {

            request(app)
                .get('/route-14/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-14/hello');
                    done();
                });
        });

        it('should not route to route 15 with an alpha thing', function(done) {

            request(app)
                .get('/route-15/hello')
                .expect(404, done);
        });

        it('should route to route 15 with a numeric thing', function(done) {

            request(app)
                .get('/route-15/15')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-15/15');
                    done();
                });
        });

        it('should not route to route 16 with a numeric thing', function(done) {

            request(app)
                .get('/route-16/16')
                .expect(404, done);
        });

        it('should route to route 16 with an alpha thing', function(done) {

            request(app)
                .get('/route-16/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-16/hello');
                    done();
                });
        });

        it('should route to route 17 with thing and another thing', function(done) {

            request(app)
                .get('/route-17/hello/hi')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-17/hello/hi');
                    done();
                });
        });

        it('should not route to route 17 with just thing', function(done) {

            request(app)
                .get('/route-17/hello')
                .expect(404, done);
        });

        it('should route to route 18 with thing', function(done) {

            request(app)
                .get('/route-18/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-18/hello?another_thing=another-thing');
                    done();
                });

        });

        it('should route to route 19 with thing', function(done) {

            request(app)
                .get('/route-19/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-19/hello');
                    done();
                });

        });

        it('should route to route 19 without thing', function(done) {

            request(app)
                .get('/route-19')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-19');
                    done();
                });

        });

        it('should route to route 20 with the last thing being thing', function(done) {

            request(app)
                .get('/route-20/hello/hi')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-20/hi/null');
                    done();
                });
        });

        it('should route to route 23 with an alpha thing', function(done) {

            request(app)
                .get('/route-23/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-23/hello');
                    done();
                });
        });

        it('should route to route 23 without a thing', function(done) {

            request(app)
                .get('/route-23')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/route-23');
                    done();
                });
        });

        it('should not route to route 23 with a numeric thing', function(done) {

            request(app)
                .get('/route-23/23')
                .expect(404, done);
        });

        it('should route to group 1 route 24 with ok', function(done) {

            request(app)
                .get('/group-1/route-24')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });

        });

        it('should route to group 1 route 1 with also-ok', function(done) {

            request(app)
                .get('/group-1/route-1')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('also-ok');
                    done();
                });

        });

        it('should route to group 2 route 25 with ok', function(done) {

            request(app)
                .get('/group-2/route-25')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to group 3 route 26 with ok', function(done) {

            request(app)
                .get('/group-3/route-26')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to group 4 route 27 with ok', function(done) {

            request(app)
                .get('/group-4/route-27')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to group 4 group 5 route 28 with ok', function(done) {

            request(app)
                .get('/group-4/group-5/route-28')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to group 6 route 29', function(done) {

            request(app)
                .get('/group-6/route-29')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/group-6/route-29');
                    done();
                });
        });

        it('should route to group 7 route 30 with middleware response', function(done) {

            request(app)
                .get('/group-7/route-30')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('group_middleware_1');
                    done();
                });
        });

        it('should route to route 31 with middleware response', function(done) {

            request(app)
                .get('/group-7/route-31')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('group_middleware_1|middleware_1');
                    done();
                });
        });

        it('should route to group 8 route 32 with middleware response', function(done) {

            request(app)
                .get('/group-8/route-32')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('group_middleware_1|group_middleware_2|middleware_1|middleware_2');
                    done();
                });
        });

        it('should route to group 9 route 33', function(done) {

            request(app)
                .get('/group-9/route-33')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/group-9/route-33');
                    done();
                });
        });

        it('should route to group 9 group 10 route 34', function(done) {

            request(app)
                .get('/group-9/group-10/route-34')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('/group-9/group-10/route-34');
                    done();
                });
        });

        it('should route to route 35 with ok', function(done) {

            request(app)
                .post('/route-35')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 36 with ok', function(done) {

            request(app)
                .put('/route-36')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 37 with ok', function(done) {

            request(app)
                .delete('/route-37')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 38 with ok', function(done) {

            request(app)
                .patch('/route-38')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 39 with ok', function(done) {

            request(app)
                .options('/route-39')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to a file in route 40 with file', function(done) {

            request(app)
                .get('/route-40/sample-jpg.jpg')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public','sample-jpg.jpg'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in a subdirectory in route 40 with file', function(done) {

            request(app)
                .get('/route-40/public-2/sample-gif.gif')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'sample-gif.gif'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should not route to the route-40 directory', function(done) {

            request(app)
                .get('/route-40')
                .expect(404, done);
        });

        it('should route to a file in route 41 with file', function(done) {

            request(app)
                .get('/route-41/sample-bmp.bmp')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'sample-bmp.bmp'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in route 42 with file', function(done) {

            request(app)
                .get('/route-42/sample-jpg.jpg')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-3', 'sample-jpg.jpg'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in route 43 with file', function(done) {

            request(app)
                .get('/route-43/sample-png.png')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'public-4', 'sample-png.png'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should not route to a missing file', function(done) {

            request(app)
                .get('/route-43/sampleskdjf-png.png')
                .expect(404, done);
        });

        it('should route to [get] route 44 with ok', function(done) {

            request(app)
                .get('/route-44')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [post] route 44 with ok', function(done) {

            request(app)
                .post('/route-44')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should not route to [put] route 44 with ok', function(done) {

            request(app)
                .put('/route-44')
                .expect(404, done);
        });

        it('should route to [get] route 45 with ok', function(done) {

            request(app)
                .get('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [post] route 45 with ok', function(done) {

            request(app)
                .post('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [put] route 45 with ok', function(done) {

            request(app)
                .put('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [delete] route 45 with ok', function(done) {

            request(app)
                .delete('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [patch] route 45 with ok', function(done) {

            request(app)
                .patch('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to [options] route 45 with ok', function(done) {

            request(app)
                .options('/route-45')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('ok');
                    done();
                });
        });

        it('should route to route 46 with thing', function(done) {

            request(app)
                .get('/route-46/hello/greeting')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('hello');
                    done();
                });
        });

        it('should route to group 11 with thing', function(done) {

            request(app)
                .get('/group-11/hello')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('hello');
                    done();
                });
        });

        it('should route to a file in route 47 with file', function(done) {

            request(app)
                .get('/route-47/sample-bmp.bmp')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'sample-bmp.bmp'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in route 48/49 with file', function(done) {

            request(app)
                .get('/route-48/route-49/sample-bmp.bmp')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'sample-bmp.bmp'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in route 50 with file', function(done) {

            request(app)
                .get('/route-50/sample-bmp.bmp')
                .expect(200)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }

                    fs.readFile(path.join(__dirname,'/../','public', 'public-2', 'sample-bmp.bmp'), { encoding: 'utf8' }, function (err, data ) {

                        new Buffer(res.body).toString().should.equal(data);
                        done();
                    });
                });
        });

        it('should route to a file in route 51 with error', function(done) {

            request(app)
                .get('/route-51')
                .expect(500)
                .end(function(err, res){

                    if (err) {
                        throw err;
                    }
                    res.text.should.equal('route 51 error');
                    done();
                });
        });

    });

});
