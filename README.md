## scenic-route

This package is part of the [musejs](https://github.com/musejs) suite of components.

This router borrows heavily from Laravel's [router](http://laravel.com/docs/5.1/routing), in that it implements a very similar API.  

This is not, however, a direct port.  Besides the obvious difference that one is
in PHP and the other is in node.js, scenic-route's implementation logic is its own, and adheres to the conventions found
in other musejs components.

One musejs convention found here is the concept of drivers.  Scenic-route ships with two: HttpDriver and ExpressDriver.
HttpDriver is the default, and it is *fast*.  Its tree-based structure is approximately 15% faster than Express.js,
while accommodating for almost every use-case of Express.

However, if you find yourself limited to using Express-only middleware, the provided ExpressDriver will use Express.js
under the hood for routing instead.

Pairing scenic-route with [encore-request](https://github.com/musejs/encore-request), [ovation-response](https://github.com/musejs/ovation-response) and 
[jam-session](https://github.com/musejs/jam-session) produces a fully abstracted, modular request/response solution.

## Installation

`npm install scenic-route`

Note: requires node.js 4.0 or higher.

## Usage

### Quickstart

```
var ScenicRoute = require('scenic-route')();

var route = ScenicRoute.make();

route.get('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});

route.post('/greeting/{name}', function(req, res) {
    
    res.end('Hello, ' + req.params.name);
});

route.serve('public/uploads', '/uploads');

ScenicRoute.listen(1337, function(err, server) {

});
```

### Details

`require('scenic-route')` yields a factory function, with the following arguments: `config`, and `controllerHandler`.
All arguments are optional.

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
    
When all routes have been defined, the static method `ScenicRoute.listen` can then be called to start the server at the specified port.

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
        hello: /^[A-Za-z]+$/
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
The options can be found [here](https://github.com/pillarjs/send#options)

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

## Advanced Usage


## Usage








## API

ScenicRoute follows inspiration.js's Route contract.  Below is a summary of the available methods.

#### get(uri, action)

Route's a GET request for a uri to an action.
```
route.get('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});
```
#### post(uri, action)

Route's a POST request for a uri to an action.
```
route.post('/hello-world', function(req, res) {
    
    res.end('Hello, world');
});
```




## Advanced usage

### The factory function

The full factory function with all its (optional) arguments are as follows:
```
var ScenicRoute = require('scenic-route')(config, errorHandler, DB);
```

`config` is an object that can be used to override the defaults used. Any and all properties supplied are optional.
Under the hood, _.defaultsDeep is used. Here's the full possible structure:
```
{
    messages: {
        [rule]: 'The message for this rule.'
    },
    rules: {
        [rule]: function(data, field, value, parameters, callback) {}
    },
    replacers: {
        [rule]: function(field, constraint) {}
    }
}
```

`errorHandler` is a function that can be used to override the default handling of errors. Whatever is returned from this
function will be passed as the error in a failed validation. The signature is as follows:
```
function(errors) {}
```

`DB` is a class adhering to inspirationjs's "DB" contract.  [babylon-db](https://github.com/musejs/babylon-db) fits right in.
Supplying this allows use of the "exists" and "unique" rules.


### Adding new rules

You may either add new rules or override existing rule implementations by supplying it in the factory's `config` object,
or if you already have a `ScenicRoute` class, you may call the `rule` method:
```
var ScenicRoute = require('scenic-route')();

ScenicRoute.rule('equals_something', function(data, field, value, parameters, callback) {

    callback(null, value === 'something');
});

var data = {
    field_1: 'something'
};
var rules = {
    field_1: 'equals_something'
};

var validator = ScenicRoute.make(data, rules);

validator.validate(function(err) {
    // this will pass.
});

```

### Conditional rules

Conditional rules can be applied in one of two ways. The first way works for rules you wish to add only if a field
is present in the data. You do this by adding the "sometimes" rule before any others.

##### Example 1:
```
var data = {
    meal_selection: 'meat'
};

var rules = {
    meal_selection: ['required', 'in:vegetables,meat'],
    type_of_meat: ['sometimes', 'required', 'in:beef,chicken,pork']
};

var validator = ScenicRoute.make(data, rules);

validator.validate(function(err) {
    // this will pass, because "type_of_meat" is not present in the data.
});
```
##### Example 2:
```
var data = {
    meal_selection: 'meat',
    type_of_meat: 'turkey'
};

var rules = {
    meal_selection: 'required|in:vegetables,meat',
    type_of_meat: ['sometimes', 'required', 'in:beef,chicken,pork']
};

var validator = ScenicRoute.make(data, rules);

validator.validate(function(err) {
    /**
     * this will fail,
     * because the "type_of_meat" field was present in the data,
     * so its conditional rules kicked in.
     */
});
```

For cases that require more complex conditions, you may use the `sometimes` method of the validator instance.

It's signature is:
```
validator.sometimes(field, rules, condition);
```
- `field` is the name of the field to apply the rules.
- `rules` are the rules to apply.
- `condition` is a function that should return a boolean to indicate if to apply the `rules` or not. It is supplied with the `data` object as an argument.

##### Example 1:
```
var data = {
    meal_selection: 'meat'
};

var rules = {
    meal_selection: ['required', 'in:vegetables,meat']
};

var validator = ScenicRoute.make(data, rules);

/**
 * This will require a "type_of_meat" field in the data,
 * if the "meal_selection" field equals "meat".
 */
validator.sometimes('type_of_meat', ['required', 'in:beef,chicken,pork'], function(data) {

    return data.meal_selection == 'meat';
});

validator.validate(function(err) {
    /**
     * this will fail,
     * because "meal_selection" was "meat",
     * causing the conditional rules for "type_of_meat" to kick in.
     */
});
```

### Message placeholders

Every message supplied (either in the factory's `config` object or in the `messages` object in `ScenicRoute.make(data, rules, messages)`)
can include placeholders. Placeholders are identified by a colon (":") before it. The most commonly found placeholder in
the default messages is ":attribute", which maps to the name of the field under validation.

Whenever an error message needs to be generated for a rule, it is first passed through functions called "replacers".
These functions are keyed by the rule they run on. Additionally, there is a default replacer called before the rule-specific
replacers are called.

You may add or overwrite the default replacers with your own functions by either supplying them in the factory's `config` object,
or if you already have a `ScenicRoute` class, you may call the `replacer` method:
```
var ScenicRoute = require('../src/factory')();

ScenicRoute.replacer('required', function(field, constraint) {

    constraint.message = constraint.message.replace(new RegExp(':attribute'), 'XXX');
});

var data = {};

var rules = {
    field_1: 'required'
};

var validator = ScenicRoute.make(data, rules);

validator.validate(function(err) {

});
```
The above example will replace the ":attribute" placeholder with the string "field", e.g. "The XXX is required.".  The original `required` replacer
replaced ":attribute" with the field name with spaces instead of non-alphanumeric characters, e.g. "The field 1 is required.".

To overwrite the default replacer, you must first get the default replacer's key, which is actually a Symbol object (to prevent key collisions).
You may do so by first calling `ScenicRoute.defaultReplacerKey()`.
```
var default_replacer_key = ScenicRoute.defaultReplacerKey();
ScenicRoute.replacer(default_replacer_key, function(field, constraint) {
    // do your replacing
});

```
## Benchmarks

Benchmarks are done using Apache Benchmark, with the tests found in `/test/performance`

`ab -t 10 -c 10 http://localhost:1337/hello-world`

##### HttpDriver: 
Metric  | Result
------------- | -------------
Requests per second  | 3121.80 [#/sec] (mean)
Time per request  | 3.203 [ms] (mean)
Time per request  | 0.320 [ms] (mean, across all concurrent requests)

##### ExpressDriver: 
Metric  | Result
------------- | -------------
Requests per second  | 2657.44 [#/sec] (mean)
Time per request  | 3.763 [ms] (mean)
Time per request  | 0.376 [ms] (mean, across all concurrent requests)