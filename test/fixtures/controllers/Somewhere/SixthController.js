"use strict";

module.exports = class SixthController {

    getGreeting(req, res) {

        res.end(req.params['greeting']);
    }
};


