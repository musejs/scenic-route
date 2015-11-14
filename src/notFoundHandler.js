"use strict";
var NotFoundError = require('./NotFoundError');

module.exports = function(uri) {

    return new NotFoundError();
};
