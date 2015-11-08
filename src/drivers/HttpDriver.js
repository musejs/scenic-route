"use strict";

var _ = require('lodash');
var http = require('http');
var url = require('url');
var finalhandler = require('finalhandler');
var parser = require('body-parser');
var path = require('path');
var qs = require('qs');
var send = require('send');

module.exports = class HttpDriver {

    constructor(ScenicRoute) {

        this.ScenicRoute = ScenicRoute;
        this._regexes = {};
        this._to_serve = [];
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

        var errorHandler = this.constructor.errorHandlerFactory(error_middleware);

        var server = http.createServer(function(req, res) {

            var verb = req.method;
            var parsed = url.parse(req.url, false, true);
            var uri = parsed.pathname;

            var action = that.findAction(verb, uri);

            _.assign(req, parsed);

            /**
             * For express.js compatibility.
             */
            res.send = function() {

                res.end.apply(res, arguments);
            };

            if (!action) {

                for(var u = 0, len = that._to_serve.length; u < len; u++) {

                    var serve = that._to_serve[u];
                    if (_.startsWith(uri, serve.route)) {

                        return serve.handler(uri.replace(serve.route, ''), req, res, function(err) {
                            if (err) {
                                errorHandler(err, req, res);
                            }
                        });
                    }
                }
                var err = that.ScenicRoute.factoryConfig().notFoundHandler(uri);

                return errorHandler(err, req, res);
            }


            req.query = qs.parse(parsed.query);
            req.params = action.params;

            var index = 0;

            var next = function(err) {

                if (err) {
                    return errorHandler(err, req, res);
                }

                var fn = action.stack[index++];

                if (fn) {

                    try {

                        fn(req, res, next);

                    } catch(err) {

                        //console.log(err);
                        err.message = err.message || 'An unknown error occurred.';
                        err.status = err.status || 500;
                        next(err);
                    }
                } else {
                    var done = finalhandler(req, res);
                    done(err);
                }
            };

            next();


        });

        server.listen(port, function(){

            callback(null, server);

        });

    }

    /**
     * Finds the action for the given verb and uri.
     *
     * @param verb
     * @param uri
     * @returns {*}
     */
    findAction(verb, uri) {

        if (!this.ScenicRoute.tree[verb]) {
            return false;
        }

        var variable_param_key = this.ScenicRoute.variableParamKey();
        var variable_regex_param_key = this.ScenicRoute.variableRegexParamKey();

        var routes = this.ScenicRoute.tree[verb].routes;

        var stack = false;

        var params = {};

        var pieces = this.ScenicRoute.parseUri(uri);

        for (var u = 0, len = pieces.length; u < len; u++) {

            var piece = pieces[u];
            var to_inspect = false;

            stack = false;

            if (routes[piece]) {

                to_inspect = routes[piece];

            } else if (routes[variable_regex_param_key]) {

                for (var x = 0, len2 = routes[variable_regex_param_key].length; x < len2; x++) {

                    var to_match = routes[variable_regex_param_key][x].regex.pattern;
                    if (this._regexes[to_match] && this._regexes[to_match].test(piece)) {

                        to_inspect = routes[variable_regex_param_key][x].regex;
                        params[to_inspect.name] = piece;
                        break;
                    }
                }
            }

            if (!to_inspect && routes[variable_param_key]) {

                to_inspect = routes[variable_param_key];
                params[to_inspect.name] = piece;
            }


            if (!to_inspect) {

                return false;
            }

            if (to_inspect.routes) {
                routes = to_inspect.routes;
            }

            if (to_inspect.stack) {
                stack = to_inspect.stack;
            }
        }

        if (!stack) {
            return false;
        }

        return {stack: stack, params: params};

    }

    parseRoutes() {

        var parsed = {};
        this.treeParser(parsed, {
            routes: this.ScenicRoute.tree
        });

        var public_routes = {};
        _.forIn(parsed, function(stack, route) {

            var pieces = route.split('/');
            var verb = pieces[0].toLowerCase();
            var route = route.replace(pieces[0], '');

            if (verb === 'public') {
                public_routes[route] = stack[stack.length - 1];
            }
        });

        var sorted_public_routes = _.sortBy(Object.keys(public_routes), function(route) {
            return route.split('/').length;
        });

        sorted_public_routes.reverse();

        var that = this;

        _.forEach(sorted_public_routes, function(route) {

            that._to_serve.push({route: route, handler: public_routes[route]});
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

                    var regex = node.regex.pattern
                        //.replace(/\\/g, "\\\\") // escape backslashes
                        .replace('/', '') // remove prefixed slash
                        .replace(/\/$/, ''); // remove trailing slash

                    that._regexes[node.regex.pattern] = new RegExp(regex);
                    var p = _.clone(pieces);
                    p.push(node.regex.pattern);
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

    static publicHandler(public_dir, public_config, notFoundHandler) {

        if (!public_config) {
            public_config = {};
        }
        public_config.root = public_dir;

        return function(uri, req, res, next) {

            send(req, uri, public_config)
                .on('error', function() {
                    next(notFoundHandler(uri));
                })
                .pipe(res);
        };

    }

    static errorHandlerFactory(error_middleware) {

        return function (err, req, res) {

            var index = 0;

            var next = function(err) {

                var fn = error_middleware[index++];

                if (fn) {

                    try {

                        fn(err, req, res, next);

                    } catch(err) {

                        //console.log(err);
                        err.message = err.message || 'An unknown error occurred.';
                        err.status = err.status || 500;
                        next(err);
                    }
                } else {
                    var done = finalhandler(req, res);
                    done(err);
                }
            };

            next(err);
        };
    }

};
