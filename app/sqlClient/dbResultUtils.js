/**
 * Created by michaelfalkenthal on 10.07.14.
 */
'use strict';
var Q = require('q');

/**
 * Removes columns form a list of tubel
 * @param keysToRemove
 * @param list
 * @returns {promise|Q.promise}
 */
function removeKeysFromValueList(keysToRemove, list){
    var deferred = Q.defer();
    var counter = 0;
    if(list.length === 0 || keysToRemove.length === 0){
        deferred.resolve(list)
    }
    var promises = [];
    list.forEach(function(tubel, index){
        promises.splice(index,0,removeColsFromTubel(keysToRemove, tubel));
        counter++;
        if(counter === list.length){
            Q.all(promises).then(function(result){
                deferred.resolve(result);
            }, function(reason){
                deferred.reject(new Error(reason));
            })
        }
    });
    return deferred.promise;
}

/**
 * Removes columns (keysToRemove) from a tubel
 * @param keysToRemove
 * @param tubel
 * @returns {promise|Q.promise}
 */
function removeColsFromTubel(keysToRemove, tubel){
    var deferred = Q.defer();
    var counter = 0;
    if(keysToRemove.length === 0){
        deferred.resolve(tubel);
    }
    keysToRemove.forEach(function(key){
        delete tubel[key];
        counter++;
        if(counter === keysToRemove.length){
            deferred.resolve(tubel);
        }
    });
    return deferred.promise;
}

/**
 * Extracts the values of column 'fieldName'
 * @param objectList ResultSet from Mapping Table
 * @param fieldName Name of Mapping Field to return in result list
 * @returns {promise|Q.promise}
 */
function extractValueList(objectList, fieldName){
    var deferred = Q.defer();
    var counter = 0;
    var list = [];

    if(objectList.length === 0){
        deferred.resolve(list);
    }
    objectList.forEach(function (item) {
        list.push(item[fieldName]);
        counter++;
        if (counter === objectList.length){
            deferred.resolve(list);
        }
    });
    return deferred.promise;
}

module.exports.removeKeysFromValueList = removeKeysFromValueList;
module.exports.extractValueList = extractValueList;