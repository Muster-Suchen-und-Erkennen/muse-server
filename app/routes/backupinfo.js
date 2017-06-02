/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadKostuemRepoBackupInfo().then(function(result){
        var stat = '<html><head><title>KostuemRepo Statistics</title></head><body><table><thead><th>TableName</th><th>RowCount</th></thead>';
        var sum = 0;
        if(result){
            result.forEach(function(item){
                var line = '<tr><td>' + item.TableName + '</td><td>' + item.RowCount + '</td></tr>';
                sum = sum + item.RowCount;
                stat = stat.concat(line);
            });
        }
        stat = stat.concat('<tr><td>Sum</td><td>' + sum + '</td></tr>');
        stat = stat.concat('</table></body></html>');
        res.status(200).send(stat);
    }).catch(function(reason){
        logger.error(reason.message);
        logger.error(reason.stack);
        res.status(500).send(reason.message);
    });
};
