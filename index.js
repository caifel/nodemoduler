module.exports = function(config) {
    var api = config.router;
    var _ = require('underscore');
    try {
        var fn;
        var path;
        var method;
        var fnName;
        var resource;
        var schemas = {};
        var intersection;
        var scopeBook = {};
        var schemaArgs = [];
        var folder = process.cwd() + '/' + config.folder + '/';
        var keyWords = ['extend', 'mixin', 'require', 'model'];
        var app = require(folder + config.main);
        var contextualize = function (current, group) {
            var next;

            switch (group) {
                case 'extend':
                    var road = [current];
                    var ref = current.extend;
                    while (ref) {
                        path = folder + ref.split('.').join('/');
                        next = scopeBook[path] || require(path);
                        ref = next.extend;
                        scopeManager(next);
                        road.push(next);
                        current = next;
                    }
                    _.each(road.reverse(), function (current, index, list) {
                        if (index) {
                            next = list[index - 1];
                            intersection = _.intersection(_.functions(next), _.functions(current));
                            _.each(intersection, function (fnName) {
                                current[fnName] = _.bind(current[fnName], _.extend(current, {
                                    callParent: next[fnName]
                                }));
                            });
                            current.model = _.union(current.model, next.model);
                            _.extend(current, _.omit(next, _.union(intersection, keyWords)));
                        }
                    });
                    break;
                case 'model':
                    _.each(current.model, function (ref) {
                        path = folder + 'model/' +  ref.split('.').join('/');
                        next = scopeBook[path] || require(path);
                        next._isModel = true;
                        next.alias = ref;
                        scopeManager(next);
                    });
                    break;
                case 'mixin':
                    _.each(current.mixin, function (ref) {
                        path = folder + 'mixin/' +  ref.split('.').join('/');
                        next = scopeBook[path] || require(path);
                        intersection = _.intersection(_.functions(next), _.functions(current));
                        _.extend(current, _.omit(next, intersection));
                        scopeManager(next);
                    });
                    break;
                case 'require':
                    _.each(current.require, function (ref) {
                        path = folder + '/' +  ref.split('.').join('/');
                        next = scopeBook[path] || require(path);
                        current[scope['alias']] = next;
                        scopeManager(next);
                    });
                    break;
                default:
                    return;
            }
        };
        var scopeManager = function(target) {
            if (_.has(scopeBook, path))
                return false;
            scopeBook[path] = target;

            _.each(keyWords, function (group) {
                _.has(target, group) && contextualize(target, group);
            });
        };
        var initMiddleWare = function () {
            path = folder + 'middleware';
            var middleware = require(path);
            scopeManager(middleware);

            _.each(app['middleware'], function (cd, wallMethod) {
                if(!_.isEqual(_.first(wallMethod), '#')) return;
                var at = 'applyTo';
                var et = 'exceptTo';
                var wall = _.bind(middleware[wallMethod.substr(1)], middleware);

                api.use(function (req, res, next) {
                    var findFn = function (route) {
                        route = route.trim();
                        var inSensitive = _.indexOf(route, '*') > - 1;
                        route = route.replace(/^\**/, '').replace(/(:[^\/]*)/g, '.\\S*');
                        return new RegExp(route + (inSensitive ? '' : '$')).test((req.url).split('?')[0]);
                    };
                    if (
                        (_.has(cd, at) && _.find(_.isString(cd[at]) ? [cd[at]] : cd[at], findFn)) ||
                        (_.has(cd, et) && !_.find(_.isString(cd[et]) ? [cd[et]] : cd[et], findFn)) ||
                        (_.isString(cd) && (cd[0] === '-' && !findFn(cd.split('-')[1]))) ||
                        (_.isString(cd) && (_.isEqual(cd, '*') || findFn(cd)))
                    )
                        wall(req, res, next);
                    else
                        next();
                });
            });
        };
        var initResources = function () {
            _.each(app.resource, function (refs, route) {
                path = folder + 'resource/' + route.split('.').join('/');
                resource = require(path);
                scopeManager(resource);

                _.each(refs, function (info, src) {
                    fnName = info.split('#')[1];
                    method = info.split('#')[0].toLowerCase();
                    fn = resource[fnName];
                    if (_.isFunction(fn)) {
                        fn = _.bind(fn, resource);
                        api[method](src, fn);
                    }
                });
            });
        };
        var initialize = function () {
            /**
             * Step 1:
             *      Loop throw everything provide each one with "underscore"
             *      and with all properties defined in "global".
             * */
            _.each(scopeBook, function (target, path) {
                target._ = _;
                _.extend(target, app.global || {});
                /**
                 * If the target is a model then the schema method is executed in order to
                 * obtain the expected object that will be passed to all who need it.
                 * */
                if (target._isModel) {
                    delete target._isModel;
                    delete scopeBook[path];
                    if (_.isFunction(target.schema))
                        /**
                         * Temporarily the "model" is keep in the "schemas" array
                         * */
                        schemas[target['alias']] = target.schema.apply(target, schemaArgs);
                    else
                        console.error('The model: "' + target['alias'] + '" does not have an schema method');
                    delete target['alias'];
                }
            });
            /**
             * Step 2:
             *      Pass the schema(s) to all those who have required it.
             * */
            _.each(scopeBook, function (target) {
                if (_.has(target, 'model'))
                    _.each(target.model, function (ref) {
                        target[ref] = schemas[ref];
                    });
            });
            schemas = {}; /** No longer needed */
            /**
             * Once models were correctly injected
             * "nodemoduler" have finished to setup the module.
             * */
            _.isFunction(app.ready) && app.ready();
            /**
             * Step 3:
             *      "Init" method of all those who have it is executed.
             * */
            _.each(scopeBook, function (target) {
                _.isFunction(target['init']) && target['init']();
            });
        };

        _.extend(app, app.global || {});
        _.isFunction(app.setupDB) && app.setupDB(schemaArgs);
        _.has(app, 'middleware') && initMiddleWare();
        _.has(app, 'resource') && initResources();
        initialize();
    } catch (err) {
        console.log(err);
    }
    return api;
};