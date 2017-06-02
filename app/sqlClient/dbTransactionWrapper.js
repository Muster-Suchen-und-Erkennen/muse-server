/**
 * Created by simon on 27.09.2015.
 * @deprecated
 */
var async = require("async");
var pool = require('./databaseConnectionPool').pool;


/*
@deprecated
 */
function waterfall (tasks, cb) {
    pool.getConnection(function (err, client, done) {
        if (err) {
            return cb(err);
        }
        client.beginTransaction( function (err) {
            if (err) {
                done();
                return cb(err);
            }
            var wrapIterator = function (iterator) {
                return function (err) {
                    if (err) {
                        client.rollback( function () {
                            done();
                            cb(err);
                        });
                    }
                    else {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var next = iterator.next();
                        if (next) {
                            args.unshift(client);
                            args.push(wrapIterator(next));
                        }
                        else {
                            args.unshift(client);
                            args.push(function (err, results) {
                                var args = Array.prototype.slice.call(arguments, 0);
                                if (err) {
                                    client.rollback (function () {
                                        done();
                                        cb(err);
                                    });
                                }
                                else {
                                    client.commit( function () {
                                        done();
                                        cb.apply(null, args);
                                    })
                                }
                            })
                        }
                        async.setImmediate(function () {
                            iterator.apply(null, args);
                        });
                    }
                };
            };
            wrapIterator(async.iterator(tasks))();
        });
    });
}

module.exports.waterfall = waterfall;