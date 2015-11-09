"use strict";

module.exports = class SeventhController {

    getGreeting(req, res) {

        res.end(req.params['greeting']);
    }
};



