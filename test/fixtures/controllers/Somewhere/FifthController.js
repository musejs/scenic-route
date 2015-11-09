"use strict";

module.exports = class FifthController {

    getGreeting(req, res) {

        res.end('hey');
    }

    postAnotherGreeting(req, res) {

        res.end('bro');
    }

};
