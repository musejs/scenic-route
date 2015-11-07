"use strict";
var _ = require('lodash');

module.exports = function(middleware) {

    if (_.isFunction(middleware)) {

        return middleware;
    }
    throw new Error('Non-function middleware is not supported in the default middleware handler. Overwrite "middlewareHandler" to support your case.');
};
