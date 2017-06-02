/**
 * Created by simon on 03.09.2015.
 */
var winston = require('winston');
var systemConfig = require("../config/configurationValues").systemConfig;
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: systemConfig.logfile,
            handleExceptions: true,
            json: false,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};