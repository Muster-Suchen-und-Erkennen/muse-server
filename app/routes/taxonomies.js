'use strict';

var logger = require("../util/logger");
var db = require('../sqlClient/mysqlclient').dbClient;
var q = require('q');

function isTaxonomyAdmin(req, res) {
    var authToken = req.headers.authorization.split('Bearer ')[1];

    var requestingUser = req.user.username;

    return db.loadUserRoles(requestingUser).then(function (roles) {
        var isTaxonomyAdmin = q.defer();
        roles.forEach(function (role) {
            if (role === 'TaxAdmin') {
                isTaxonomyAdmin.resolve(true);
                return isTaxonomyAdmin.promise;
                //return true;
            }
        }, function (err) {
            res.status(501).send('Error while retrieving user roles.');
        });
        isTaxonomyAdmin.resolve(false);

        return isTaxonomyAdmin.promise;
    }, function (err) {
        res.status(501).send('Error while retrieving user roles.');
    });
}

exports.updateableTaxonomies = function(req, res){
    db.updateableTaxonomies().then(function (updateableTaxonomies) {
        res.status(200).send(updateableTaxonomies);
    }, function (err) {
        logger.log('Error while retrieving updateable taxonomies.');
        res.status(501).send('Error while retrieving updateable taxonomies.');
    });
};

exports.addTaxonomyElement = function(req, res){

    isTaxonomyAdmin(req, res).then(function (isTaxonomyAdmin) {
        if (isTaxonomyAdmin) {
            var body = req.body;

            db.addTaxonomyElement(req.params.taxonomy, body).then(function () {
                res.status(200).end();
            }, function (err) {
                logger.log('Error while adding new taxonomy element.');
                res.status(501).send('Error while adding new taxonomy element.');
            });
        } else {
            res.status(403).send('Only taxonomy admins can edit taxonomies.');
        }
    });
};

exports.deleteTaxonomyElement = function(req, res){

    isTaxonomyAdmin(req, res).then(function (isTaxonomyAdmin) {
        if (isTaxonomyAdmin) {
            db.deleteTaxonomyElement(req.params.taxonomy, req.params.name).then(function () {
                res.status(200).end();
            }, function (err) {
                logger.log('Error while deleting taxonomy element.');
                res.status(501).send('Error while deleting taxonomy element.');
            });
        } else {
            res.status(403).send('Only taxonomy admins can edit taxonomies.');
        }
    });
};
