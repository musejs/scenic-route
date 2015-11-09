"use strict";

module.exports = class SecondController {

    getGreeting(req, res) {

        res.end('hello|' +req.params.addition);
    }
};

