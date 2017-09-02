## scenic-route

This router was inspired heavily by Laravel's [router](http://laravel.com/docs/5.1/routing), in that it implements a very similar API.  

This router employs the concept of "drivers" to promote flexibility.  In this case, drivers
control how actions are routed to, given a URL.  Scenic-route ships with two: HttpDriver and ExpressDriver.
HttpDriver is the default, and its tree-based structure is slightly faster than Express.js.

However, if you find yourself limited to using Express-only middleware, the provided ExpressDriver will use Express.js
under the hood for routing instead.


## Installation

`npm install scenic-route`

Note: requires node.js 4.0 or higher.

## Usage

### Quickstart

```
var http = require('http');
var ScenicRoute = require('scenic-route')();

var route = ScenicRoute.make();

route.get('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});

route.post('/greeting/{name}', function(req, res) {
    
    res.end('Hello, ' + req.params.name);
});

route.serve('public/uploads', '/uploads');

http.createServer(ScenicRoute.requestHandler()).listen(1337, function() {
    console.log('Listening!');
});
```

### Details

`require('scenic-route')` yields a factory function, with an optional`config` argument.

Once the factory function is called, it will return a `ScenicRoute` class, which you may then use to create a new
route instance with which to define routes.  This can be done by calling either `new ScenicRoute(options)`
or `ScenicRoute.make(options)`.

The `options` argument is an optional plain javascript object, with the following optional parameters:
- `prefix`: the route prefix to add to all routes defined with this instance
- `middleware`: an array or single function of Connect-style middleware
- `namespace`: iif using controllers, controllers will belong to this namespace
- `name`: prefixed to the names of any named routes defined with this instance

Routes are defined using the route instance object, which has methods that correspond to each supported HTTP verb 
(`get`, `post`, `put`, `delete`, `patch`, `options`).  Each of these methods accept the same arguments: `uri`, and `action`.
`uri` is the route you wish to match, e.g. "/hello-world", while 
`action` can be either a Connect-style function whose arguments are `req` and `res`, 
or a plain javascript object with the following keys:
- `uses` - a required Connect-style function that serves as the action
- `middleware` - an optional array or single function of Connect-style middleware to run before the action
- `name` - an optional string that names this route, which can then be used to generate URLs to this route, using the static method `SceniceRoute.url(name)`
- `where` - an optional plain javascript object whose keys are route params, and values are a regex (RegExp object, regex literal, or a regex string) to constrain the param to
- `verb` - the associated HTTP verb for this action
    
When all routes have been defined, the static method `ScenicRoute.requestHandler` will return a function to send to `http.createServer` (or `https.createServer`).

### Express.js Usage
This router can be used seamlessly with express.js, via the ExpressDriver.

```
var http = require('http');
var ScenicRoute = require('scenic-route')();
var ExpressDriver = require('scenic-route/src/drivers/ExpressDriver');
var express = require('express');

var app = express();
ExpressDriver.express(app); // set the express instance

ScenicRoute.driver(ExpressDriver); // set the new driver

var route = ScenicRoute.make();

route.get('/hello-world', function(req, res) {
    
    res.send('Hello, world');
});

route.post('/greeting/{name}', function(req, res) {
    
    res.send('Hello, ' + req.params.name);
});

route.serve('public/uploads', '/uploads');

http.createServer(ScenicRoute.requestHandler()).listen(1337, function() {
    console.log('Listening!');
});
/*
 * Alternatively, because ScenicRoute.requestHandler() returns the express app,
 * you can call ScenicRoute.requestHandler().listen(1337, function() {});
 * to start the server.
 */

```

### Basic Routes

The simplest form of routing accepts a Connect-style function as the action.

```
route.get('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});
```
Note: the following is equivalent to the above example.
```
route.get('/hello-world', {
    uses: function(req, res) {
              
        res.end('Hello, world');
    }
});

```
The route instance has methods for each HTTP verb (`get`, `post`, `put`, `delete`, `patch`, `options`).
```
/*
 * This route will only match POST requests to "/hello-world"
 */
route.post('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});
```

### Route Parameters

Route parameters are segments of the url that can act as variables.  These segments are specified by curly braces `{...}`
in the route definition.  The captured values are made available to `req` via `req.params`, which is a plain javascript
object whose keys are the names of the route parameters.

```
route.get('/hello/{name}', function(req, res) {
    
    res.end('Hello, '+ req.params.name);
});
```

#### Regex constraints

Regex constraints can be added by supplying a `where` in the route definition.

```
/*
 * This route will only match if the "name" parameter is composed of alpha characters only.
 */
route.get('/hello/{name}', {
    uses: function(req, res) {
              
        res.end('Hello, '+ req.params.name);
    },
    where: {
        name: /^[A-Za-z]+$/
    }
});
```
One interesting effect of adding constraints is that you can have the same uri route to different actions using different constraints:
```
/*
 * Route alpha identifiers to this route.
 */
route.get('/user/{identifier}', {
    uses: function(req, res) {
              
        res.end('Your name is '+ req.params.identifier);
    },
    where: {
        identifier: /^[A-Za-z]+$/
    }
});

/*
 * Route numeric identifiers to this route.
 */
route.get('/user/{identifier}', {
    uses: function(req, res) {
              
        res.end('Your id is '+ req.params.identifier);
    },
    where: {
        identifier: /^\d+$/
    }
});

/*
 * Route all other identifiers to this route.
 */
route.get('/user/{identifier}', {
    uses: function(req, res) {
              
        res.end(req.params.identifier + ' is not valid!');
    }
});
```

You may also specify "global" constraints, which will take effect every time that param is found.  
This is accomplished with `ScenicRoute.pattern(param, pattern)`.
```
ScenicRoute.pattern('user_id', /^\d+$/);

route.get('/user/{user_id}', function(req, res) {
    ...
});

route.post('/user/{user_id}/pet', function(req, res) {
    ...
});
```
Both of the above routes will have the constraint that "user_id" must be numeric.

#### Optional parameters
Optional parameters can be specified by curly braces and a question mark (`{...?}`).  They must be the last segment in the uri, or an error will be thrown.
```
/*
 * This will match for "/hello/Shaun" and "/hello"
 */
route.get('/hello/{name?}', function(req, res) {

    var name = req.params.name || 'Anonymous';

    res.end('Hello, '+ name);
});
```

### Middleware

Middleware can be added by supplying a `middleware` in the route definition, with an array of Connect-style middleware functions.
They will run in sequence before the action.
```
route.get('/foo', {
    middleware: [
        function(req, res, next) {

            req.from_middleware = 'middleware_1';
            next();
        },
        function(req, res, next) {

            req.from_middleware+= '|middleware_2';
            next();
        }
    ],
    uses: function(req, res) {

        res.end(req.from_middleware); // sends "middleware_1|middleware_2"
    }
});
```

#### Error-handling Middleware

Like Express.js, error-handling middleware are of the signature `function(err, req, res, next) {}`. You may define error middleware
using `ScenicRoute.addErrorMiddleware(middleware)`.  The middleware will get added to a stack that gets called 
whenever an error is detected in your middleware or action functions (either supplied to `next()`, or thrown at the top-level).

You may add multiple error middleware by either supplying `ScenicRoute.addErrorMiddleware` with an array of middleware, 
or by multiple calls to `ScenicRoute.addErrorMiddleware`.  Like "regular" middleware, the error middleware will execute in order.

Unlike "regular" middleware, however, to get to the next error middleware, you must continuously supply an error to `next()`.

If you call `next()` without an error, the rest of the error middleware stack will not be called, 
and the default final handler will be called (which you probably won't want).

All three of the following routes will result in errors that will be handled:
```
ScenicRoute.addErrorMiddleware(function(err, req, res, next) {

    console.log(err);
    next(err); // if we didn't supply err to next, it would've skipped the next error middleware.
});

ScenicRoute.addErrorMiddleware(function(err, req, res, next) {

    res.statusCode = err.status || 500;
    res.end(err.message || 'An internal error occurred.');
});


route.get('/error-prone-action', function(req, res) {

    throw new Error('Oops!');
});

route.get('/another-error-prone-action', function(req, res, next) {

    next(new Error('Oops!'));
});

route.get('/error-prone-middleware', {
    middleware: function(req, res, next) {
                
        next(new Error('Oops!'));
    },
    uses: function(req, res) {
        
        res.end('This will never happen.');
    }
});
```
Note: in the above example, the "/another-error-prone-action" action uses "next", even though it is an action. This is allowed,
though calling "next()" without an error in an action will end up calling the default final handler, which you probably don't want.

Also, notice that unlike Express, you can define error middleware at any point--you don't have to save it for last.

### Named Routes

You can name routes to easily generate URLs to them, using `ScenicRoute.url(name, params)`, where `params` is optional.
```
route.get('/foo', {
    uses: function(req, res) {
    
        var url = ScenicRoute.url('my-route'); // this equals "/foo"
        ...
    },
    name: 'my-route'
});
```
Route parameters can be supplied as the second argument to `ScenicRoute.url`.
```
route.get('/foo/{bar}', {
    uses: function(req, res) {
    
        var params = {
            bar: 'baz'
        };
        var url = ScenicRoute.url('my-route', params); // this equals "/foo/baz"
        ...
    },
    name: 'my-route'
});
```
Additional parameters not a part of the uri will be appended as a query string.
```
route.get('/foo', {
    uses: function(req, res) {
    
        var params = {
            bar: 'baz'
        };
        var url = ScenicRoute.url('my-route', params); // this equals "/foo?bar=baz"
        ...
    },
    name: 'my-route'
});
```

### Route groups

Routes can be grouped to minimize the number of route definitions.  Creating a route group yields a new route instance in a closure that you can then use to specify the routes in that group.
Routes can be grouped by a specific uri prefix, or to supply common middleware, specify a common namespace, or add a prefix to all named routes.

Route groups are created by calling `route.group(options, closure)`.

The `options` argument is a plain javascript object, with the following parameters, all of which are optional:
- `prefix`: the uri prefix to add to all routes in this group
- `middleware`: an array or single function of Connect-style middleware to apply to all routes in this group
- `namespace`: if using controllers, controllers in this group will belong to this namespace
- `name`: prefixed to the names of any named routes in this group

Grouping by prefix:
```
route.group({prefix: '/foo'}, function(route) {

    /*
     * Will match for "/foo/bar"
     */
    route.get('/bar', function(req, res) {
        ...
    });
    
    /*
     * Will match for "/foo/baz"
     */    
    route.get('/baz', function(req, res) {
        ...
    });
});
```
Grouping by middleware:
```
var m = function(req, res, next) {
    // will be applied to all routes in the group
    next();
};
route.group({middleware: m}, function(route) {

    /*
     * Will match for "/bar", and call m before its action.
     */
    route.get('/bar', function(req, res) {
        ...
    });
    
    /*
     * Will match for "/baz", and call m before its action.
     */    
    route.get('/baz', function(req, res) {
        ...
    });
});
```
Supplying a name prefix:
```
route.group({name: 'foo-'}, function(route) {

    /*
     * Will match for "/bar"
     */
    route.get('/bar', function(req, res) {
        ...
    });
    
    /*
     * Will match for "/baz", and have a name of "foo-baz"
     */    
    route.get('/baz', {
        uses: function(req, res) {
        
            var url = ScenicRoute.url('foo-baz'); // this equals "/baz"
            ...
        },
        name: 'baz
    });
});
```
Of course, none of these group options are mutually exclusive:
```
var m = function(req, res, next) {
    // will be applied to all routes in the group
    next();
};
route.group({prefix: '/foo', middleware: m, name: 'foo-'}, function(route) {

    /*
     * Will match for "/foo/bar", and call m before its action.
     */
    route.get('/bar', function(req, res) {
        ...
    });
    
    /*
     * Will match for "/foo/baz", call m before its action, and have a name of "foo-baz".
     */    
    route.get('/baz', {
        uses: function(req, res) {
        
            var url = ScenicRoute.url('foo-baz'); // this equals "/foo/baz"
            ...
        },
        name: 'baz
    });

});
```
Groups can also be nested:
```
var m = function(req, res, next) {
    // will be applied to all routes in the group
    next();
};
route.group({prefix: '/foo', middleware: m, name: 'foo-'}, function(route) {

    /*
     * Will match for "/foo/bar", and call m before its action.
     */
    route.get('/bar', function(req, res) {
        ...
    });
    
    route.group({prefix: '/bad', name: 'bad-'}, function(route) {
    
        /*
         * Will match for "/foo/bad/baz", call m before its action, and have a name of "foo-bad-baz".
         */    
        route.get('/baz', {
            uses: function(req, res) {
            
                var url = ScenicRoute.url('foo-bad-baz'); // this equals "/foo/bad/baz"
                ...
            },
            name: 'baz
        }); 
           
        /*
         * Will match for "/foo/boo", and call m before its action.
         */
        route.get('/boo', function(req, res) {
            ...
        });
            
    });
    
});
```

### Serving Public Files

Files out of a directory can be served using `route.serve(uri, public_dir, public_config)`, where `public_config` is optional.

```
var public_dir = path.join(__dirname,'/../public/uploads');

/*
 * All files found in the "/public/uploads" directory
 * will now be available under the "uploads/*" route.
 */
route.serve('/uploads', public_dir);
```
More complex functionality can be accomplished by using `public_config`, which is a plain javascript object of options.
The options can be found [here](https://github.com/pillarjs/send#options).

Additionally, scenic-route adds the following options:
- `headers` - a function of signature `function(res, path, stat) {}` that can be used to set headers
- `directoryHandler` - a function of signature `function(req, res, next) {}` that will be called whenever a directory is requested
    - the default currently defers to the `notFoundHandler`
```
var public_dir = path.join(__dirname,'/../public/uploads');

var public_config = {
    directoryHandler: function(req, res, next) {
        
        res.writeHead(302, {
          'Location': 'http://localhost'
          //add other headers here...
        });
        res.end();
    }
};

/*
 * If a directory is requested, it will redirect to home.
 */
route.serve('/uploads', public_dir, public_config);
```

## API

#### `route.get(uri, action)`
Routes a GET request for a `uri` to an `action`.

#### `route.post(uri, action)`
Routes a POST request for a `uri` to an `action`.

#### `route.put(uri, action)`
Routes a PUT request for a `uri` to an `action`.

#### `route.delete(uri, action)`
Routes a DELETE request for a `uri` to an `action`.

#### `route.patch(uri, action)`
Routes a PATCH request for a `uri` to an `action`.

#### `route.options(uri, action)`
Routes an OPTIONS request for a `uri` to an `action`.

#### `route.serve(uri, public_dir, public_config)`
Routes a GET request for a file in `public_dir`, under `uri`.

More details [here](#serving-public-files).

#### `route.match(verbs, uri, action)`
For each of the verbs specified, routes a request for a `uri` to an `action`.

#### `route.any(uri, action)`
Routes a request for a `uri` to an `action` for any verb.

#### `route.group(group_options, closure)`
Creates a grouping of routes.

More details [here](#route-groups).

#### `route.controller(uri, controller_name, controller_options)`
Creates routes based on the controller.

More details [here](#advanced-controller-support).

#### `ScenicRoute.make(config)`
Creates a new route instance.

#### `ScenicRoute.pattern(param, pattern)`
Associates a route param with a regex pattern. Each time this route param is found in a route definition, it will be
constrained by the supplied regex pattern.

More details [here](#regex-constraints).

#### `ScenicRoute.requestHandler()`
Returns a function accepted by `http.createServer`, `https.createServer`, etc.

#### `ScenicRoute.url(name, params)`
Generates a url to a named route.

More details [here](#named-routes).

#### `ScenicRoute.addErrorMiddleware(errorMiddleware)`
Adds middleware to a stack that will be called whenever an error occurs in an action or in its middleware.

This middleware is of the signature `function(err, req, res, next) {}`.

More details [here](#error-handling-middleware).

#### `ScenicRoute.factoryConfig()`
Returns the config options passed to the factory function as they currently stand.

#### `ScenicRoute.actionHandler(closure)`
Sets a new `actionHandler` function.

More details [here](#controller-support).

#### `ScenicRoute.middlewareHandler(middleware)`
Sets a new `middlewareHandler` function.

#### `ScenicRoute.notFoundHandler(closure)`
Sets a new `notFoundHandler` function.

#### `ScenicRoute.driver(Driver)`
Sets a new driver.

#### `ScenicRoute.controllerHandler(closure)`
Sets a `controllerHandler` function.

More details [here](#advanced-controller-support).


## Advanced Usage

### The factory function

The full factory function with all its (optional) arguments are as follows:
```
var ScenicRoute = require('scenic-route')(config);
```

`config` is an object that can be used to override the defaults used. Any and all properties supplied are optional.
Under the hood, [_.defaultsDeep](https://lodash.com/docs#defaultsDeep) is used. Here's the full possible structure:
```
{
    actionHandler: function(action, options, uri) {},
    middlewareHandler: function(middleware) {},
    notFoundHandler: function(uri) {},
    controllerHandler: function(controller_name, options, controller_options) {},
    Driver: Driver
}
```

`actionHandler` is a function that can be used to perform additional logic on actions. Afterwards, it should return the action object.
It can be used to provide controller support, as described [here](#controller-support), to inject dependencies into actions,
or any other manipulation to the action object.

`middlewareHandler` is similar to `actionHandler`, except it operates on middleware.

`notFoundHandler` is called whenever a requested route is not found.  It should return an object that will act as the error.
This error will be called by `next(err)`, and as such will kick off the chain of error-handling middleware, as all errors that are passed to 
`next` do.

`controllerHandler` is used to enable the `route.controller` function.  More details [here](#enabling-routecontroller).

`Driver` is any class/object that adheres to the ScenicRouteDriver contract.  HttpDriver and ExpressDriver both ship with scenic-route.

### Controller Support

Typically, you'd want your router to have some knowledge of your controllers, so that you could specify controller actions,
rather than closures in your route definitions.  This router makes no assumptions about how your controllers are structured or invoked,
so this knowledge must first be given to scenic-route.

One such place this knowledge is supplied is the `actionHandler`, which is a function that is used to perform some additional work on the actions specified in route definitions.
It can be supplied either as a `config` option in the scenic-route factory function, or if you already have
a `ScenicRoute` class, by supplying it to `ScenicRoute.actionHandler(closure)`.

The default `actionHandler` simply checks if `action.uses` is a function.  If not, it throws an error.  To support controllers,
you'll most likely want to change this behavior to allow `action.uses` to be a string, so that you can define routes like this:
```
/*
 * This will call the IndexController's "greeting" method.
 */
route.get('/hello', 'IndexController@greeting');
```

As an example, let's assume your controllers are ES6 classes, where each method in the class is an action:
```
class IndexController {

    greeting(req, res) {

        res.end('hi');
    }
}
```
To support this setup, you could change `actionHandler` like so:
```
function actionHandler(action, options, uri) {

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

var ScenicRoute = require('scenic-route')({
    actionHandler: actionHandler
});

var route = ScenicRoute.make();

/*
 * This will call the IndexController's "greeting" method.
 */
route.get('/hello', 'IndexController@greeting');

```
The above action handler can accept a string as an action, in which case, it parses the string into a controller and it's method (separated by "@").
It then loads the controller from the `controllers` directory, and sets `action.uses` to the appropriate controller method.

You may have also noticed that the handler takes into account `options.namespace` when loading the controller, 
where in this case, if a controller belongs to a particular namespace, it means that it is in the subdirectory named after that namespace.

### Advanced Controller Support

There is a convenience method `route.controller(uri, controller_name, controller_options)`, which takes a controller,
and makes routes for each of its methods, provided that its methods are named with the camel-case convention as {verb}{Action}.

For example, assume this controller:
```
class GreetingController {

    getHi(req, res) {

        res.end('hi');
    }
    
    getHello(req, res) {

        res.end('hello');
    }
    
    getHola(req, res) {

        res.end('hola');
    }

}
```
Instead of creating these routes:
```
route.get('/greeting/hi', 'GreetingController@getHi');
route.get('/greeting/hello', 'GreetingController@getHello');
route.get('/greeting/hola', 'GreetingController@getHola');
```
You can simply use `route.controller`:
```
route.controller('/greeting', 'GreetingController');
```

The `route.controller` method takes the uri, then appends the ["kebab-case"](https://lodash.com/docs#kebabCase) version of each method
found in that controller, using the appropriate verb.  If you don't want the method to be appended to the end of the uri, you can specify
where you'd like it using an empty parameter placeholder: `{}`
```
route.controller('/greeting/{}/welcome', 'GreetingController');
```
The above will create routes equivalent to:
```
route.get('/greeting/hi/welcome', 'GreetingController@getHi');
route.get('/greeting/hello/welcome', 'GreetingController@getHello');
route.get('/greeting/hola/welcome', 'GreetingController@getHola');
```
You can of course also use regular route parameters as well:
```
route.controller('/greeting/{}/{name}', 'GreetingController');
```
The above will create routes equivalent to:
```
route.get('/greeting/hi/{name}', 'GreetingController@getHi');
route.get('/greeting/hello/{name}', 'GreetingController@getHello');
route.get('/greeting/hola/{name}', 'GreetingController@getHola');
```

#### Controller Options

You may supply additional options for a controller method by providing it as the third argument to `route.controller`.
The `controller_options` must be a plain javascript object whose keys are the method names, and the values are a plain
javascript object with optional keys of `middleware` and `name`.
```
var controller_options = {
    getHi: {
        middleware: function(req, res, next) {
            ...
            next();
        }
    },
    getHola: {
        name: 'spanish-hello'
    }
};
route.controller('/greeting', 'GreetingController', controller_options);
```
The above route definition adds a middleware specific to "/greeting/hi", and also names "/greeting/hola" as "spanish-hello".

#### Enabling `route.controller`

In order to enable `route.controller` support, you must supply a `controllerHandler`, 
which is a function that is provided with a controller's name, and must then generate a plain javascript object, 
whose keys are the method names of the controller, and values are the action function.

A `controllerHandler` can be supplied in the `config` argument in the scenic-route factory function, or if you already have
a `ScenicRoute` class, by supplying it to `ScenicRoute.controllerHandler(closure)`.
```
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

ScenicRoute.controllerHandler(controllerHandler);
var route = ScenicRoute.make();

route.controller('/greeting', 'GreetingController');
```
The above `controllerHandler` first loads the controller based on its name and namespace (or lack of).  It then finds the instance methods
of the controller, and finally, for each of those methods, it maps to an action function that calls the appropriate controller method.


## Benchmarks

Benchmarks are done using Apache Benchmark, with the tests found in `performance.js`

`ab -t 10 -c 10 http://localhost:1337/hello/world`

##### ScenicRoute + HttpDriver: 
Metric  | Result
------------- | -------------
Requests per second  | 2912.77 #/sec (mean)
Time per request  | 3.433 ms (mean)
Time per request  | 0.343 ms (mean, across all concurrent requests)

##### Express.js: 
Metric  | Result
------------- | -------------
Requests per second  | 2714.60 #/sec (mean)
Time per request  | 3.684 ms (mean)
Time per request  | 0.368 ms (mean, across all concurrent requests)