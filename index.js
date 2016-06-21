module.exports = function(express, config) {
    var _ = require('underscore');
    var api = express.Router();
    try {
        var fn;
        var path;
        var paths;
        var method;
        var fnName;
        var resource;
        var intersection;
        var scopeBook = {};
        var extensionGroups = ['extend', 'mixins'];
        var dependencyGroups = ['models', 'services', 'requires'];
        var folder = process.cwd() + '/' + config.folder + '/';
        var cf = require(folder + 'config');
        var app = require(folder + config.main);
        var schemaArgs = [];
        var contextualize = function (target, group, route) {
            var scope;

            if (_.isEmpty(route))
                return false;

            switch (group) {
                case 'extend':
                    path = folder + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    intersection = _.intersection(_.functions(scope), _.functions(target));
                    _.each(intersection, function (fnName) {
                        target[fnName] = _.bind(target[fnName], _.extend(target, {
                            callParent: scope[fnName]
                        }));
                    });
                    _.extend(target, _.omit(scope, intersection));
                    break;
                case 'models':
                    path = folder + group + '/' +  route.split('.').join('/');
                    scope = scopeBook[path] || require(path).schema.apply(require(path), schemaArgs);
                    target[require(path)['alias']] = scope;
                    break;
                case 'mixins':
                    path = folder + group + '/' + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    intersection = _.intersection(_.functions(scope), _.functions(target));
                    _.extend(target, _.omit(scope, intersection));
                    break;
                case 'services':
                    path = folder + group + '/' + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    target[scope['alias']] = scope;
                    break;
                case 'requires':
                    path = folder + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    target[scope['alias']] = scope;
                    break;
                default:
                    return;
            }
            scopeManager(scope);
        };
        var scopeManager = function(target) {
            if (_.has(scopeBook, path))
                return false;

            _.extend(target, cf);
            scopeBook[path] = target;

            _.each(extensionGroups, function (group) {
                contextualize(target, group, target[group]);
                delete target[group];
            });

            _.each(dependencyGroups, function (group) {
                _.each(target[group], function (route) {
                    contextualize(target, group, route)
                });
                delete target[group];
            });

            delete target['alias'];
        };
        var initMiddleWare = function () {
            var middleware = require(folder + 'middleware');
            scopeManager(middleware);

            _.each(app['middleware'], function (cd, wallMethod) {
                if(!_.isEqual(_.first(wallMethod), '#')) return;
                var at = 'applyTo';
                var et = 'exceptTo';
                var wall = _.bind(middleware[wallMethod.substr(1)], middleware);

                api.use(function (req, res, next) {
                    var findFn = function (route) {
                        route = route.trim();
                        var isSensitive = _.indexOf(route, '*') > - 1;
                        route = route.replace(/^\**/, '').replace(/(:[^\/]*)/g, '.\\S*');
                        return new RegExp(route + (isSensitive ? '' : '$')).test((req.url).split('?')[0]);
                    };
                    if (
                        (_.has(cd, at) && _.find(_.isString(cd[at]) ? [cd[at]] : cd[at], findFn)) ||
                        (_.has(cd, et) && !_.find(_.isString(cd[et]) ? [cd[et]] : cd[et], findFn)) ||
                        (_.isString(cd) && (_.isEqual(cd, '*') || findFn(cd)))
                    )
                        wall(req, res, next);
                    else
                        next();
                });
            });
        };
        
        var initResources = function () {
            _.each(app.resources, function (config, route) {
                paths = {};
                _.extend(paths, app[config.extend]);
                _.extend(paths, config.paths);
                paths = _.isEmpty(paths) ? config : paths; //
                path = folder + 'resources/' + route.split('.').join('/');
                resource = require(path);

                scopeManager(resource);

                _.each(paths, function (info, test) {
                    test = (config.base || '') + test;
                    method = info.split('#')[0].toLowerCase();
                    fnName = info.split('#')[1];
                    fn = resource[fnName];
                    if (_.isFunction(fn)) {
                        fn = _.bind(fn, resource);
                        api[method](test, fn);
                    }
                });
            });
        };

        var initialize = function () {
            _.each(scopeBook, function (target) {
                if (_.has(target, 'init') && _.isFunction(target['init']))
                    target['init']();
            });
            _.isFunction(app.onModuleReady) && app.onModuleReady();
        };

        _.extend(app, cf);
        _.isFunction(app.setUpDatabase) && app.setUpDatabase(schemaArgs);
        _.has(app, 'middleware') && initMiddleWare();
        _.has(app, 'resources') && initResources();
        initialize();
    } catch (err) {
        console.log(err);
    }
    return api;
};