/**
 * Created by no on 01.05.2016.
 */
var crypto = require('crypto'),algorithm = 'aes-256-ctr',password = 'sdfi34)§cs§E';

// FIXME switch to a secure password encryption scheme

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;