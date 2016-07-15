module.exports = function(config) {
    var api = config.router;
    var _ = require('underscore');
    try {
        var fn;
        var path;
        var method;
        var fnName;
        var resource;
        var intersection;
        var scopeBook = {};
        var schemaArgs = [];
        var folder = process.cwd() + '/' + config.folder + '/';
        var keyWords = ['extend', 'mixin', 'service', 'require', 'model'];
        var app = require(folder + config.main);
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
                case 'model':
                    path = folder + group + '/' +  route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    target[scope['alias']] = scope;
                    scope.isModel = true;
                    break;
                case 'mixin':
                    path = folder + group + '/' + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    intersection = _.intersection(_.functions(scope), _.functions(target));
                    _.extend(target, _.omit(scope, intersection));
                    break;
                case 'service':
                    path = folder + group + '/' + route.split('.').join('/');
                    scope = scopeBook[path] || require(path);
                    target[scope['alias']] = scope;
                    break;
                case 'require':
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
            scopeBook[path] = target;

            _.each(keyWords, function (group) {
                if (_.isArray(target[group]))
                    _.each(target[group], function (route) {
                        contextualize(target, group, route)
                    });
                else
                    contextualize(target, group, target[group]);
                delete target[group];
            });
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
            _.isFunction(app.ready) && app.ready();
            _.each(scopeBook, function (target) {
                target._ = _;
                delete target['alias'];
                _.extend(target, app.global || {});
                if (target.isModel) {
                    delete target.isModel;
                    if (_.isFunction(target.schema))
                        _.extend(target, target.schema.apply(target, schemaArgs));
                    else
                        console.warn('All models must have an schema method');
                }
                _.has(target, 'init') && _.isFunction(target['init']) && target['init']();
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