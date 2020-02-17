
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require("./util/logger");
var automatedLogger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var fs = require('fs');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var q = require('q');
var users = require('./sqlClient/users');
var pathTo = require('path-to-regexp');
var passwords = require('./util/passwords');
var systemConfig = require("./config/configurationValues").systemConfig;
var app = express();

var jwtSecret = '234F$A&&%FWQWQRV';
var userObject ="";
var keys = [];
var imagePath = pathTo('/basiselement/:basiselementId/image', keys);
var logStream = fs.createWriteStream(systemConfig.logfile, {'flags': 'a'});





/**
 * all environments.
 * Port Information must be changed manually in /sqlClient/baseelement.js
 */
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(multer());
app.use(cors());

// To disable Authentication just comment the following line
app.use(expressJwt({ secret: jwtSecret }).unless({ path: ['/login', imagePath ,'/backupinfo']}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Logging Methods///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ensure log directory exists
fs.existsSync(systemConfig.logDirectory) || fs.mkdirSync(systemConfig.logDirectory);
/*
Method to append username in log text
 */
automatedLogger.token('user', function getUser(req)
{
    try{
        return req.user.username;
    }
    catch (Exception){
        return "";
    }
});
//logger.error("Error");
//logger.info("Info");
//logger.debug("debug");


if (app.get('env') == 'production') {
    app.use(automatedLogger(':date[iso] :method :url Status:  :status User: :user', {skip: function(req, res){ return req.method === "GET"} ,stream: logStream}));

}
else{
    console.log(app.get('env'));
    app.use(automatedLogger(':date[iso] :method :url Status: :status User: :user', { stream: logStream }));
    app.use(errorHandler());
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Authentication Methods////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
Load login information from request body and encrypt them. Then do a database query to check if the user uses the correct password.
If true, run next() method
 */
function authenticate(req, res, next) {
    var body = req.body;
    if (!body.username || !body.password) {
        res.status(400).end('Must provide username or password');
        return;
    }
    // generic error:
    function onError(rejected){
        res.status(500).end('Something went wrong with authentication. Please contact your system administrator.');
    }
    var promise = users.loadLoginInformation(body.username);
    promise.then(function(hash){
        passwords.compare_password(body.password, hash).then(function (success) {
            if (success) {
                // user provided right password
                users.loadUserRoles(body.username).then(function (roles) {
                    userObject = {
                        username: body.username,
                        roles: roles
                    };
                    next();
                }, function (err) {
                    res.status(500).end('Something went wrong with authentication. Please contact your system administrator.');
                });
            } else {
                res.status(401).send('Username or password incorrect');
            }
        }, onError);
    }, onError);
}

app.post('/login', authenticate, function (req, res) {
    var token = jwt.sign({
        username: userObject.username,
        roles: userObject.roles
    }, jwtSecret);
    res.send({
        token: token,
        user: userObject
    });
});

/*
Methode wird vom Index Controller der Muse UI gelesen, um in der Nav Leiste Login bzw. Logout anzuzeigen
 */
app.get('/loggedin', function (req, res) {
    res.send(req.user);
});

app.post('/changePassword', function (req, res) {
    var authToken = req.headers.authorization.split('Bearer ')[1];

    var requestingUser = req.user.username;

    // generic error:
    function onError(rejected){
        res.status(500).send('Something went wrong. Please contact your system administrator.');
        logger.log(rejected);
    }

    var isAdmin = false;

    var body = req.body;
    var pw = body.current_password.toString();
    if (!body.current_password || !body.new_password || !body.username) {
        res.status(400).end('Must provide old and new password');
        return;
    }


    var promise;

    if (requestingUser === body.username) {
        promise = users.loadLoginInformation(body.username);
    } else {
        promise = users.loadUserRoles(requestingUser).then(function (roles) {
            roles.forEach(function (role) {
                if (role === 'Admin') {
                    isAdmin = true;
                }
            }, onError);
            return null;
        });
    }

    promise.then(function(hashOld){
        if (!hashOld && isAdmin) {
            passwords.hash_password(body.new_password).then(function (newHash) {
                users.updateLoginInformation(body.username, newHash)
                    .then(function(resolved){
                        res.send({changed: true});
                    }, onError);
            }, onError);
            return;
        } else if (!hashOld) {
            res.status(403).send('Only admins can change a password for another user.');
            return;
        }
        // old_pasword check:
        passwords.compare_password(body.current_password, hashOld).then(function (success) {
            if (! success) {
                res.status(403).send('Old password is wrong.');
                return;
            }
            // new_password check
            if (body.new_password !== body.current_password) {
                // hash and set new password
                passwords.hash_password(body.new_password).then(function (newHash) {
                    var promise2 = users.updateLoginInformation(body.username, newHash);
                    promise2.then(function(resolved){
                        res.send({changed: true});
                    }, onError);
                });
            } else {
                // new password is the same as old one!
                res.status(403).send('New password must not be identical to old password!');
                return;
            }
        }, onError);
    }, onError);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//App Routes////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Films
 */
app.get('/filme', require('./routes/film').index);
app.post('/filme', require('./routes/film').create);
app.delete('/filme/:filmId', require('./routes/film').destroy);
app.get('/filme/:filmId', require('./routes/film').show);
app.put('/filme/:filmId', require('./routes/film').update);

/**
 * Roles
 */
app.get('/filme/:filmId/rollen', require('./routes/rolle').rolesOfFilm);
app.delete('/filme/:filmId/rollen/:rollenId', require('./routes/rolle').deleteRoleOfFilm);
app.get('/filme/:filmId/rollen/:rollenId', require('./routes/rolle').roleOfFilm);
app.post('/filme/:filmId/rollen', require('./routes/rolle').createRoleOfFilm);
app.put('/filme/:filmId/rollen/:rollenId', require('./routes/rolle').updateRoleOfFilm);

/**
 * Costumes
 */
app.get('/filme/:filmId/rollen/:rollenId/kostueme', require('./routes/kostuem').index);
app.get('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId', require('./routes/kostuem').show);
app.post('/filme/:filmId/rollen/:rollenId/kostueme', require('./routes/kostuem').create);
app.delete('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId', require('./routes/kostuem').destroy);
app.put('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId', require('./routes/kostuem').update);

/**
 * Screenshots Films
 */
app.get('/filme/:filmId/screenshots', require('./routes/film').indexScreenshots);
app.get('/filme/:filmId/screenshots/:screenshotId', require('./routes/film').loadScreenshot);
app.get('/filme/:filmId/screenshotthumbs', require('./routes/film').indexThumbs);
app.post('/filme/:filmId/screenshots', require('./routes/film').createScreenshot);
app.delete('/filme/:filmId/screenshots/:screenshotId', require('./routes/film').destroyScreenshot);

/**
 * Screenshots Roles
 */
app.get('/filme/:filmId/rollen/:rollenId/screenshots', require('./routes/rolle').indexScreenshots);
app.get('/filme/:filmId/rollen/:rollenId/screenshots/:screenshotId', require('./routes/rolle').loadScreenshot);
app.get('/filme/:filmId/rollen/:rollenId/screenshotthumbs', require('./routes/rolle').indexThumbs);
app.post('/filme/:filmId/rollen/:rollenId/screenshots', require('./routes/rolle').createScreenshot);
app.delete('/filme/:filmId/rollen/:rollenId/screenshots/:screenshotId', require('./routes/rolle').destroyScreenshot);

/**
 * Screenshots Costumes
 */
app.get('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/screenshots', require('./routes/kostuem').indexScreenshots);
app.get('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/screenshots/:screenshotId', require('./routes/kostuem').loadScreenshot);
app.get('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/screenshotthumbs', require('./routes/kostuem').indexThumbs);
app.post('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/screenshots', require('./routes/kostuem').createScreenshot);
app.delete('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/screenshots/:screenshotId', require('./routes/kostuem').destroyScreenshot);

/**
 * Baseelements
 */
app.get('/basiselemente/:basiselementId', require('./routes/basiselement').queryBasiselement);
app.post('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente', require('./routes/basiselement').create);
app.delete('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente/:basiselementId', require('./routes/basiselement').destroy);
app.put('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente/:basiselementId', require('./routes/basiselement').update);
app.get('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente', require('./routes/basiselement').index);
app.get('/basiselement/:basiselementId/image', require('./routes/basiselement').loadImage);
app.get('/basiselement/:basiselementId/thumb', require('./routes/basiselement').loadThumb);
app.get('/basiselement/:basiselementId/filename', require('./routes/basiselement').loadBaseelementImageFileName);
app.get('/basiselement/:basiselementId/link', require('./routes/basiselement').getImageLink);

/**
 * Baseelement Relations
 */
app.post('/basiselementrelationen', require('./routes/basiselementrelation').create);
app.get('/basiselementrelationen', require('./routes/basiselementrelation').getEmptyRelations);
app.delete('/basiselementrelationen/:subjekt/:praedikat/:objekt', require('./routes/basiselementrelation').destroy);

/**
 * Primitives
 */
app.get('/teilelemente/:teilelementId', require('./routes/teilelement').queryTeilelement);
app.post('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente/:basiselementId/teilelemente', require('./routes/teilelement').create);
app.delete('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente/:basiselementId/teilelemente/:teilelementId', require('./routes/teilelement').destroy);
app.put('/filme/:filmId/rollen/:rollenId/kostueme/:kostuemId/basiselemente/:basiselementId/teilelemente/:teilelementId', require('./routes/teilelement').update);

/**
 * KostuemRepo BackupInfo
 */
app.get('/backupinfo', require('./routes/backupinfo').index);

/**
 * Domain Resources not implemented with Express-Resource
 */
app.get('/alterseindruecke', require('./routes/alterseindruck').index);
app.get('/basiselementdomaene', require('./routes/basiselementdomaene').index);
app.get('/charaktereigenschaften', require('./routes/charaktereigenschaft').index);
app.get('/darstellernachnamen', require('./routes/darstellernachname').index);
app.get('/darstellervornamen', require('./routes/darstellervorname').index);
app.get('/designs', require('./routes/design').index);
app.get('/farben', require('./routes/farbe').index);
app.get('/farbeindruecke', require('./routes/farbeindruck').index);
app.get('/farbkonzepte', require('./routes/farbkonzept').index);
app.get('/formen', require('./routes/form').index);
app.get('/funktionen', require('./routes/funktion').index);
app.get('/genres', require('./routes/genre').index);
app.get('/kostuembildnernachnamen', require('./routes/kostuembildnernachname').index);
app.get('/kostuembildnervornamen', require('./routes/kostuembildnervorname').index);
app.get('/kostuemkurztexte', require('./routes/kostuemkurztext').index);
app.get('/koerpermodifikationen', require('./routes/koerpermodifikation').index);
app.get('/koerperteile', require('./routes/koerperteil').index);
app.get('/materialien', require('./routes/material').index);
app.get('/materialeindruecke', require('./routes/materialeindruck').index);
app.get('/operatoren', require('./routes/operator').index);
app.get('/produktionsorte', require('./routes/produktionsort').index);
app.get('/regisseurnachnamen', require('./routes/regisseurnachname').index);
app.get('/regisseurvornamen', require('./routes/regisseurvorname').index);
app.get('/rollen', require('./routes/rolle').index);  //Todo check this, why do we need rolle.index!?
app.get('/rollenberufe', require('./routes/rollenberuf').index);
app.get('/spielorte', require('./routes/spielort').index);
app.get('/spielortfreitexte', require('./routes/spielortfreitext').index);
app.get('/stereotypen', require('./routes/stereotyp').index);
app.get('/spielzeiten', require('./routes/spielzeit').index);
app.get('/tageszeiten', require('./routes/tageszeit').index);
app.get('/teilelementdomaene', require('./routes/teilelementdomaene').index);
app.get('/trageweisen', require('./routes/trageweise').index);
app.get('/typusdomaene', require('./routes/typus').index);
app.get('/zustaende', require('./routes/zustand').index);
app.get('/kostuembasiselemente', require('./routes/kostuembasiselement').index);

// statistics
app.get('/statistic', require('./routes/statistics').general);

// diagnostics
app.get('/diagnostic', require('./routes/diagnostics').general);

// taxonomies
app.get('/taxonomies', require('./routes/taxonomies').updateableTaxonomies);
app.post('/taxonomies/:taxonomy', require('./routes/taxonomies').addTaxonomyElement);
app.delete('/taxonomies/:taxonomy/:name', require('./routes/taxonomies').deleteTaxonomyElement);

// all Costumes
app.get('/kostueme', require('./routes/kostuem').indexFull);

// users (admin functions)
app.get('/users', require('./routes/users').index);
app.get('/users/roles/', require('./routes/users').getOwnRoles);
app.get('/users/:username/roles', require('./routes/users').getUserRoles);

app.post('/users/:username', require('./routes/users').createUser);
app.delete('/users/:username', require('./routes/users').deleteUser);

app.post('/users/:username/roles/:role', require('./routes/users').addUserRole);
app.delete('/users/:username/roles/:role', require('./routes/users').removeUserRole);

/**
 * Prepare options for https mode

var options = {
    key: fs.readFileSync('/etc/ssl/private/muse.key'),
    cert: fs.readFileSync('/etc/ssl/certs/muse.crt')
};
 */


/**
 * Create the desired server (http or https)
 */

// Run with http on localhost, for productivity system run https with options!
var server = require('http').createServer(app);
//var server = require('https').createServer(options, app);

/**
 * Now start the server
 */
server.listen(app.get('port'), function(){
    logger.info('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function (err) {
    logger.error(err);
});
