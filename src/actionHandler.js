"use strict";
var _ = require('lodash');

module.exports = function(action, options) {

    if (_.isFunction(action.uses)) {

        return action;
    }
    throw new Error('Non-function actions are not supported in the default action handler. Overwrite "actionHandler" to support your case.');
};
