"use strict";
var path = require('path');
var public_dir = path.join(__dirname,'/../', 'public');


function ok(req, res) {

    res.end('ok');
}

module.exports = function(ScenicRoute) {

    var route = ScenicRoute.make();

    route.get('/', ok);

    route.get('/route-1', ok);

    route.get('route-2', ok);

    route.get('route 3', ok);

    route.get('/route-4/route-5', ok);

    route.get('/route-6/route-7/route-8', ok);

    route.get('/routedot.', ok);

    route.get('/routedot.2', ok);

    route.get('/routeslash/', ok);

    route.get('routeslash2/', ok);

    route.get('/route-9', {
        uses: ok
    });

    route.get('/route-10', {
        uses: ok,
        name: 'route-ten'
    });

    route.get('/route-11', {
        uses: function(req, res) {

            res.end(req.from_middleware);
        },
        middleware: function(req, res, next) {

            req.from_middleware = 'middleware_1';
            next();
        }
    });

    route.get('/route-12', {
        uses: function(req, res) {

            res.end(req.from_middleware);
        },
        middleware: [
            function(req, res, next) {

                req.from_middleware = 'middleware_1';
                next();
            },
            function(req, res, next) {

                req.from_middleware+= '|middleware_2';
                next();
            }
        ]
    });

    route.get('/route-13/{thing}', function(req, res) {

        res.end(req.params['thing']);
    });

    route.get('/route-14/{thing}', {
        name: 'route-fourteen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-fourteen', {
                thing: req.params['thing']
            }));
        }
    });

    route.get('/route-15/{thing}', {
        name: 'route-fifteen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-fifteen', {
                thing: req.params['thing']
            }));
        },
        where: {
            thing: /^\d+$/
        }
    });

    route.get('/route-16/{thing}', {
        name: 'route-sixteen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-sixteen', {
                thing: req.params['thing']
            }));
        },
        where: {
            thing: "^[A-Za-z]+$"
        }
    });

    route.get('/route-17/{thing}/{another_thing}', {
        name: 'route-seventeen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-seventeen', {
                thing: req.params['thing'],
                another_thing: req.params['another_thing']
            }));
        }
    });

    route.get('/route-18/{thing}', {
        name: 'route-eighteen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-eighteen', {
                thing: req.params['thing'],
                another_thing: 'another-thing'
            }));
        }
    });

    route.get('/route-19/{thing?}', {
        name: 'route-nineteen',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-nineteen', {
                thing: req.params['thing']
            }));
        }
    });

    route.get('/route-20/{thing}/{thing}', {
        name: 'route-twenty',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-twenty', {
                thing: req.params['thing']
            }));
        }
    });


    route.get('/route-23/{thing?}', {
        name: 'route-twenty-three',
        uses: function(req, res) {

            res.end(ScenicRoute.url('route-twenty-three', {
                thing: req.params['thing']
            }));
        },
        where: {
            thing: /^[A-Za-z]+$/
        }
    });

    route.group({prefix: '/group-1'}, function(route) {

        route.get('/route-24', ok);
    });

    route.group({prefix: '/group-1'}, function(route) {

        route.get('/route-1', function(req, res) {

            res.end('also-ok');
        });
    });

    route.group({prefix: 'group-2'}, function(route) {

        route.get('/route-25', ok);
    });

    route.group({prefix: '/group-3'}, function(route) {

        route.get('route-26', ok);
    });

    route.group({prefix: '/group-4'}, function(route) {

        route.get('/route-27', ok);

        route.group({prefix: '/group-5'}, function(route) {

            route.get('/route-28', ok);
        });
    });

    route.group({prefix: '/group-6'}, function(route) {

        route.get('route-29', {
            name: 'route-twenty-nine',
            uses: function(req, res) {

                res.end(ScenicRoute.url('route-twenty-nine', {
                    thing: req.params['thing']
                }));
            },
            where: {
                thing: /^\d+$/
            }
        });
    });

    route.group({
        prefix: '/group-7',
        middleware: function(req, res, next) {

            req.from_group_middleware = 'group_middleware_1';
            next();
        },
        name: 'group-seven|'
    }, function(route) {

        route.get('/route-30', {
            uses: function(req, res) {

                res.end(ScenicRoute.url('group-seven|route-thirty'));
            },
            name: 'route-thirty'
        });
    });

    route.group({
        prefix: '/group-7',
        middleware: function(req, res, next) {

            req.from_middleware = 'group_middleware_1';
            next();
        },
        name: 'group-seven|'
    }, function(route) {

        route.get('/route-30', {
            uses: function(req, res) {

                res.end(req.from_middleware);
            }
        });

        route.get('/route-31', {
            middleware: function(req, res, next) {

                req.from_middleware+= '|middleware_1';
                next();
            },
            uses: function(req, res) {

                res.end(req.from_middleware);
            }
        });
    });

    route.group({
        prefix: '/group-8',
        middleware: [
            function(req, res, next) {

                req.from_middleware = 'group_middleware_1';
                next();
            },
            function(req, res, next) {

                req.from_middleware+= '|group_middleware_2';
                next();
            }
        ],
        name: 'group-eight|'
    }, function(route) {

        route.get('/route-32', {
            middleware: [
                function(req, res, next) {

                    req.from_middleware+= '|middleware_1';
                    next();
                },
                function(req, res, next) {

                    req.from_middleware+= '|middleware_2';
                    next();
                }
            ],
            uses: function(req, res) {

                res.end(req.from_middleware);
            }
        });
    });

    route.group({prefix: '/group-9', name: 'group-nine|'}, function(route) {

        route.get('/route-33', {
            uses: function(req, res) {
                res.end(ScenicRoute.url('group-nine|route-thirty-three'));
            },
            name: 'route-thirty-three'
        });

        route.group({prefix: '/group-10', name: 'group-ten|'}, function(route) {

            route.get('/route-34', {
                uses: function(req, res) {
                    res.end(ScenicRoute.url('group-nine|group-ten|route-thirty-four'));
                },
                name: 'route-thirty-four'
            });
        });
    });

    route.post('/route-35', ok);
    route.put('/route-36', ok);
    route.delete('/route-37', ok);
    route.patch('/route-38', ok);
    route.options('/route-39', ok);

    route.serve('/route-40', public_dir);
    route.serve('/route-41', path.join(public_dir, 'public-2'));
    route.serve('/route-42', path.join(public_dir, 'public-3'));
    route.serve('/route-43', path.join(public_dir, 'public-2', 'public-4'));

    route.match(['get', 'post'], '/route-44', ok);
    route.any('/route-45', ok);

    route.get('/route-46/{thing}/greeting', function(req, res) {

        res.end(req.params['thing']);

    });

    route.group({prefix: 'group-11/{thing}'}, function(route) {

        route.get('/', function(req, res) {

            res.end(req.params['thing']);

        });
    });

    route.serve('route-47', path.join(public_dir, 'public-2'));
    route.serve('route-48/route-49', path.join(public_dir, 'public-2'));
    route.serve('route-50', path.join(public_dir, 'public-2'));


    return route;
};
