"use strict";

var _ = require('lodash');
var path = require('path');
var express = require('express');

module.exports = class ExpressDriver {

    constructor(ScenicRoute) {

        this.ScenicRoute = ScenicRoute;
        this.constructor.express = express;
        this.constructor.express_app = express();
    }

    /**
     * Starts the server on the specified port.
     *
     * @param port
     * @param callback
     */
    listen(port, callback) {

        var error_middleware = this.ScenicRoute.factoryConfig().error_middleware;
        var that = this;

        this.constructor.express_app.use(function(req, res, next) {

            var err = that.ScenicRoute.factoryConfig().notFoundHandler(req.path);

            next(err);
        });

        _.forEach(error_middleware, function(fn) {

            that.constructor.express_app.use(fn);
        });

        var server = this.constructor.express_app.listen(port, function () {
            if (callback) {
                callback(null, server);
            }
        });

    }

    parseRoutes() {

        var that = this;
        var parsed = {};
        this.treeParser(parsed, {
            routes: this.ScenicRoute.tree
        });

        var public_routes = {};

        _.forIn(parsed, function(stack, route) {

            var pieces = route.split('/');
            var verb = pieces[0].toLowerCase();
            var route = route.replace(pieces[0], '');

            if (verb !== 'public') {

                that.constructor.express_app[verb](route, stack);
            } else {
                public_routes[route] = stack;
            }
        });

        var sorted_public_routes = _.sortBy(Object.keys(public_routes), function(route) {
            return route.split('/').length;
        });

        sorted_public_routes.reverse();

        _.forEach(sorted_public_routes, function(route) {

            that.constructor.express_app.get(path.join(route, '*'), public_routes[route]);
        });
    }

    treeParser(parsed, node, pieces) {

        var variable_param_key = this.ScenicRoute.variableParamKey();
        var variable_regex_param_key = this.ScenicRoute.variableRegexParamKey();

        var that = this;

        if (!pieces) {
            pieces = [];
        }

        if (node.stack) {
            parsed[path.join.apply(path.join, pieces)] = node.stack;
        }

        if (node.routes) {

            _.forIn(node.routes, function(node, key) {

                if (key !== variable_regex_param_key && key !== variable_param_key) {

                    var p = _.clone(pieces);
                    p.push(key);
                    that.treeParser(parsed, node, p);
                }
            });

            if (node.routes[variable_regex_param_key]) {
                _.forEach(node.routes[variable_regex_param_key], function(node) {

                    var regex = node.regex.pattern;
                    if (_.startsWith(regex, '/')) {
                        regex = _.trimLeft(regex, '/');
                    }
                    if (_.startsWith(regex, '^')) {
                        regex = _.trimLeft(regex, '^');
                    }
                    if (_.endsWith(regex, '/')) {
                        regex = _.trimRight(regex, '/');
                    }
                    if (_.endsWith(regex, '$')) {
                        if (!_.endsWith(regex, "\\$")) {
                            regex = _.trimRight(regex, '$');
                        }
                    }

                    var key = ':'+node.regex.name + '('+ regex + ')';

                    var p = _.clone(pieces);
                    p.push(key);
                    that.treeParser(parsed, node.regex, p);
                });

            }
            if (node.routes[variable_param_key]) {

                var key = ':'+node.routes[variable_param_key].name;

                var p = _.clone(pieces);
                p.push(key);
                that.treeParser(parsed, node.routes[variable_param_key], p);
            }
        }

    }

    static make(ScenicRoute) {

        return new this(ScenicRoute);
    }
};

