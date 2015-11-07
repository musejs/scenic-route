"use strict";
var _ = require('lodash');
var path = require('path');
var qs = require('qs');

module.exports = function(config, controllerHandler) {

    var actionHandler = require('./actionHandler');
    var middlewareHandler = require('./middlewareHander');
    var notFoundHandler = require('./notFoundHandler');
    var Driver = require('./drivers/HttpDriver');

    /**
     * Setup defaults.
     */
    if (!config) {
        config = {};
    }

    _.defaultsDeep(config, {
        actionHandler: actionHandler,
        middlewareHandler: middlewareHandler,
        notFoundHandler: notFoundHandler,
        error_handlers: [],
        Driver: Driver
    });

    return class ScenicRoute {

        constructor(options) {

            this.options = this.constructor.normalizeOptions(options);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        get(uri, action) {

            this.route('GET', uri, action);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        post(uri, action) {

            this.route('POST', uri, action);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        put(uri, action) {

            this.route('PUT', uri, action);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        delete(uri, action) {

            this.route('DELETE', uri, action);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        patch(uri, action) {

            this.route('PATCH', uri, action);
        }

        /**
         * Route a uri to an action.
         *
         * @param uri
         * @param action
         */
        options(uri, action) {

            this.route('OPTIONS', uri, action);
        }

        /**
         * Route a uri to a public directory to serve its contents.
         *
         * @param uri
         * @param public_dir
         * @param public_config
         */
        serve(uri, public_dir, public_config) {

            var action = config.Driver.publicHandler(public_dir, public_config);

            this.route('PUBLIC', uri, action);
        }

        /**
         * Route a uri to an action for the specified verbs.
         *
         * @param verbs
         * @param uri
         * @param action
         */
        match(verbs, uri, action) {

            if (!_.isArray(verbs)) {
                verbs = [verbs];
            }

            for (var x = 0; x < verbs.length; x++) {

                var verb = verbs[x];

                this[verb](uri, action);
            }
        }

        /**
         * Route a uri to an action for any verb.
         *
         * @param uri
         * @param action
         */
        any(uri, action) {

            this.match(this.constructor.verbs, uri, action);
        }

        /**
         * Create a route group.
         *
         * @param group_options
         * @param closure
         */
        group(group_options, closure) {

            group_options = this.constructor.normalizeOptions(group_options);

            var new_options = {
                prefix: path.join(this.options.prefix, group_options.prefix),
                middleware: this.options.middleware.concat(group_options.middleware),
                namespace: path.join(this.options.namespace, group_options.namespace),
                as: this.options.as + group_options.as
            };

            closure(this.constructor.make(new_options));
        }

        /**
         * Route a uri to controller methods.
         *
         * Requires a controllerHandler to be given in the factory function.
         *
         * @param uri
         * @param controller_name
         * @param controller_options
         */
        controller(uri, controller_name, controller_options) {

            if (!controllerHandler) {

                throw new Error('No controller handler given.');
            }


            if (!controller_options) {
                controller_options = {};
            }

            var actions = controllerHandler(controller_name, this.options);

            this.group({prefix: uri}, function(route) {

                _.forEach(Object.keys(actions), function(action) {

                    _.forEach(route.constructor.verbs, function(verb) {

                        if (_.startsWith(action, verb)) {

                            var subroute = _.kebabCase(action.replace(verb, ''));

                            if (subroute == 'index') {
                                subroute = '';
                            }

                            var middleware = [];
                            var name = null;

                            if (controller_options[action]) {

                                if (controller_options[action].middleware) {

                                    middleware = route.constructor.normalizeOptionsMiddleware(controller_options[action]);
                                }

                                if (controller_options[action].as) {

                                    name = controller_options[action].as;
                                }
                            }

                            route[verb]('/'+subroute, {
                                uses: actions[action],
                                middleware: middleware,
                                as: name
                            });
                        }

                    });

                });

            });

        }

        /**
         * Internal method to route a uri to an action for a given verb.
         *
         * @param verb
         * @param uri
         * @param action
         */
        route(verb, uri,  action) {

            var optional_pos = uri.indexOf('?}');

            if (optional_pos !== -1 && optional_pos !== uri.length - 2) {

                throw new Error('Optional param is not the suffix of the uri ' +uri);
            }

            var pieces = this.constructor.normalizeUri(path.join(this.options.prefix, uri));
            var action_description = this.normalizeAction(action);

            this.createBranch(verb, pieces, action_description);
        }

        /**
         * Internal method to create a branch in the tree.
         *
         * @param verb
         * @param pieces
         * @param action_description
         */
        createBranch(verb, pieces, action_description) {

            if (!this.constructor.tree[verb]) {

                this.constructor.tree[verb] = {
                    routes: {}
                };
            }
            var routes = this.constructor.tree[verb].routes;
            var piece;

            for (var u = 0, len = pieces.length; u < len; u++) {

                piece = pieces[u];
                var param_name = null;
                var f = piece.indexOf('{');
                var l = piece.indexOf('}');
                var regex = null;

                if (f === 0 && l === piece.length - 1 && l !== -1) {

                    param_name = piece.replace('{', '').replace('?}', '').replace('}', '');

                    if (this.constructor.patterns[param_name] && !action_description.where[param_name]) {
                        action_description.where[param_name] = this.constructor.patterns[param_name];
                    }

                    if (action_description.where[param_name]) {

                        regex = action_description.where[param_name];

                        piece = action_description.where[param_name].toString();

                        if (!routes['??']) {
                            routes['??'] = [];
                        }
                        routes['??'].push({});
                        routes = routes['??'][routes['??'].length - 1];

                    } else {
                        piece = '?';
                    }
                }

                if (!routes[piece]) {

                    routes[piece] = {};
                }

                if (regex) {
                    routes[piece].pattern = regex;
                }

                if (param_name) {
                    routes[piece].name = param_name;
                }

                if (u != len - 1) {

                    if (!routes[piece].routes) {
                        routes[piece].routes = {};
                    }
                    routes = routes[piece].routes;
                }
            }

            routes[piece].stack = this.options.middleware
                .concat(action_description.middleware)
                .concat(action_description.action);

            if (action_description.name) {
                this.constructor.names[action_description.name] = pieces.join('/').replace('/', '');
            }

            var last_piece = pieces[pieces.length - 1];

            var l = last_piece.indexOf('?}');

            if (l === last_piece.length - 2 && l !== -1) {

                pieces.pop();

                this.createBranch(verb, pieces, action_description);
            }
        }

        /**
         * Normalize an arbitrary action into an object.
         *
         * @param action
         * @returns {{middleware: Array, closure: *, name: *, where: {}}}
         */
        normalizeAction(action) {

            var middleware = [];
            var name = null;
            var where = {};

            if (_.isPlainObject(action)) {

                if (action.middleware) {

                    middleware = this.constructor.normalizeOptionsMiddleware(action);
                }

                if (action.as) {
                    name = action.as;
                    if (this.options.as) {
                        name = this.options.as + name;
                    }
                }

                if (!action.uses) {
                    throw new Error('Missing the "uses" parameter in your route definition.');
                }

                where = action.where || {};

                _.forIn(where, function(regex, param) {

                    if (_.isString(regex)) {

                        where[param] = new RegExp(regex);
                    }
                });

                action = action.uses;
            }

            return {
                middleware: middleware,
                closure: config.actionHandler(action),
                name: name,
                where: where
            };
        }

        /**
         * Returns a new instance of ScenicRoute.
         *
         * @param options
         * @returns {ScenicRoute}
         */
        static make(options) {

            return new this(options);
        }

        /**
         * Associates a route param with a regex pattern.
         *
         * @param param
         * @param pattern
         */
        static pattern(param, pattern) {

            if (_.isString(pattern)) {
                pattern = new RegExp(pattern);
            }

            this.patterns[param] = pattern;
        }

        /**
         * Starts the server.
         *
         * @param port
         * @param callback
         */
        static startServer(port, callback) {

            var driver = config.Driver.make(this.tree);

            driver.parseRoutes();

            driver.listen(port, config.error_handlers, callback);

        }

        /**
         * Creates a string URL for the route specified by the given name.
         *
         * @param name
         * @param params
         */
        static url(name, params) {

            if (!this.names[name]) {
                return null;
            }

            var uri = this.names[name];

            var query = {};

            if (!params) {
                params = {};
            }
            var has_query = false;

            _.forIn(params, function(value, param) {

                if (uri.indexOf('{'+param+'}') !== -1) {

                    uri = uri.replace('{'+param+'}', value);

                } else if (uri.indexOf('{'+param+'?}') !== -1) {

                    uri = uri.replace('{'+param+'?}', value);

                } else {

                    has_query = true;
                    query[param] = value;
                }
            });

            uri = uri.replace(/\{.*?\?}/g, ''); //remove optional params
            uri = uri.replace(/\{.*?\}/g, 'null'); //replace regular unfilled params with null
            uri = uri.replace(/\/+$/, ''); //remove any unintended trailing slashes

            if (has_query) {
                uri+= '?'+qs.stringify(query);
            }

            return uri;

        }

        /**
         * Adds a middleware to the stack that gets called when there's an error.
         *
         * @param errorMiddleware
         */
        static addErrorMiddleware(errorMiddleware) {

            config.error_handlers.push(config.middlewareHandler(errorMiddleware));
        }

        /**
         * Sets a new action handler.
         *
         * @param closure
         */
        static actionHandler(closure) {

            config.actionHandler = closure;
        }

        /**
         * Sets a new middleware handler.
         *
         * @param closure
         */
        static middlewareHandler(closure) {

            config.middlewareHandler = closure;
        }

        /**
         * Sets a new "not found" handler.
         *
         * @param closure
         */
        static notFoundHandler(closure) {

            config.notFoundHandler = closure;
        }

        /**
         * Sets a new driver.
         *
         * @param Driver
         */
        static driver(Driver) {

            config.Driver = Driver;
        }

        static get tree() {

            if (!this._tree) {
                this._tree = {};
            }
            return this._tree;
        }

        static get names() {

            if (!this._names) {
                this._names = {};
            }
            return this._names;
        }

        static get patterns() {

            if (!this._patterns) {
                this._patterns = {};
            }
            return this._patterns;
        }

        static get verbs() {

            return ['get', 'post', 'put', 'delete', 'patch', 'options'];
        }

        static normalizeOptions(options) {

            if (!options) {
                options = {};
            }
            options.prefix = options.prefix || '/';
            options.middleware = options.middleware || [];
            options.namespace = options.namespace || '';
            options.as = options.as || '';

            if (!_.isArray(options.middleware)) {
                options.middleware = [options.middleware];
            }

            return options;

        }

        static normalizeUri(uri) {

            uri = uri.replace('/', ''); // remove prefixed slashes
            uri = uri.replace(/\/+$/, ''); // remove trailing slashes

            uri = '/'+uri;
            var pieces = uri.split('/');

            pieces[0] = '/';

            if (uri === '/') {
                pieces = ['/'];
            }
            return pieces;
        }

        static normalizeOptionsMiddleware(options) {

            var middleware = [];

            if (!_.isArray(options.middleware)) {

                options.middleware = [options.middleware];
            }

            _.forEach(options.middleware, function(m) {

                middleware.push(config.middlewareHandler(m));
            });

            return middleware;
        }

    };

};