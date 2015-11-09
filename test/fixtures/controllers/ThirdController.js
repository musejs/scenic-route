"use strict";

module.exports = class ThirdController {

    getGreeting(req, res) {

        res.end('sup');
    }

    getAnotherGreeting(req, res) {

        res.end('howdy');
    }
};

