"use strict";

module.exports = class FourthController {

    getGreeting(req, res) {

        res.end('hola');
    }

    postAnotherGreeting(req, res) {

        res.end('aloha');
    }

};

