## scenic-route
This package is part of the [musejs](https://github.com/musejs) suite of components.

This router borrows heavily from Laravel's [router](http://laravel.com/docs/5.1/routing), in that it implements a very similar API.  

This is not, however, a direct port.  Besides the obvious difference that one is
in PHP and the other is in node.js, scenic-route's implementation logic is its own, and adheres to the conventions found
in other musejs components.

One of the musejs conventions found here is the concept of drivers.  Scenic-route ships with two: HttpDriver and ExpressDriver.
HttpDriver is the default, and it is *fast*.  Its tree-based structure is approximately 15% faster than Express.js,
while accommodating for almost every use-case of Express.

However, if you find yourself limited to using Express-only middleware, the provided ExpressDriver will use Express.js
under the hood for routing instead.


## Installation

`npm install scenic-route`

Note: requires node.js 4.0 or higher.

## Usage
`require('scenic-route')` yields a factory function, with the following arguments: `config`, and `controllerHandler`.
All arguments are optional.

Once the factory function is called, it will return a `ScenicRoute` class, which you may then use to create a new
route instance.  This can be done by calling either `new ScenicRoute(options)`
or `ScenicRoute.make(options)`.

- The `options` argument is an optional plain javascript object, with the following optional parameters:
    - `prefix`: the route prefix to add to all routes defined with this instance
    - `middleware`: an array or single function of Connect-style middleware
    - `namespace`: if using controllers, this namespace can be used to identify controllers
    - `as`: prefixed to the names of any named routes defined with this instance


### Basic Example
```
var ScenicRoute = require('scenic-route')();

var route = ScenicRoute.make();

route.get('/', function(req, res) {
    
    res.end('Hello, world!');
});

route.listen(1337, function(err, server) {

});

```
A few things to note about this example:
- Only the `data` and `rules` are required. There are already default messages for every rule.
- Rules in this example were supplied interchangeably as either a string of combined rules, or as an array.
- The `validate` function is asynchronous.


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