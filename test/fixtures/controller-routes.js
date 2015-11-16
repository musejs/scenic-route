"use strict";
var path = require('path');
var _ = require('lodash');

function getInstanceMethods(C, methods) {

    methods = _.without(Object.getOwnPropertyNames(C.prototype), 'constructor');

    var parent = Object.getPrototypeOf(C);

    if (parent.prototype) {

        methods = methods.concat(getInstanceMethods(parent, methods));
    }

    return _.uniq(methods);
}

function controllerHandler(controller_name, options, controller_options) {

    var controller_path = path.join(__dirname, 'controllers', options.namespace, controller_name);

    var Controller = require(controller_path);
    var controller = new Controller();

    var methods = getInstanceMethods(Controller);

    var actions = {};

    _.forEach(methods, function(method) {

        actions[method] = controller[method];
    });

    return actions;

}

function actionHandler(action, options) {

    if (_.isString(action.uses)) {

        var pieces = action.uses.split('@');

        if (pieces.length != 2) {
            throw new Error('Controller action must be in the format "[controller_name]@[method]".');
        }

        var controller_name = _.trim(pieces[0]);
        var method = _.trim(pieces[1]);

        var controller_path = path.join(__dirname, 'controllers', options.namespace, controller_name);

        var Controller = require(controller_path);
        var controller = new Controller();

        action.uses = controller[method];
    }

    if (_.isFunction(action.uses)) {

        return action;
    }

    throw new Error('Cannot determine action.');
}


module.exports = function(ScenicRoute) {

    ScenicRoute.controllerHandler(controllerHandler);
    ScenicRoute.actionHandler(actionHandler);

    var route = ScenicRoute.make();

    route.controller('/controller-route-1', 'FirstController');

    route.controller('/controller-route-2', 'SecondController', {
        getGreeting: {
            middleware: function(req, res, next) {
                req.params['addition'] = 'yo';
                res.end(ScenicRoute.url('controller-2-greeting', req.params));
            },
            name: 'controller-2-greeting'
        }
    });

    route.get('/controller-route-3/greeting', 'ThirdController@getGreeting');
    route.get('/controller-route-4/greeting', {
        uses: 'ThirdController@getAnotherGreeting'
    });


    route.group({prefix: '/controller-group', namespace: 'Somewhere'}, function(route) {

        route.controller('/controller-route-5', 'FourthController');
        route.post('/controller-route-6', 'FifthController@postAnotherGreeting');

    });

    route.controller('/controller-route-7/{greeting}', 'Somewhere/SixthController');

    route.controller('/controller-route-8/{}/{greeting}', 'Somewhere/SeventhController');

    return route;

};
