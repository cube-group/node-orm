//coming soon...
var config = {
    'host': 'weixin001.mysql.rds.aliyuncs.com',
    'port': 3306,
    'user': 'linyang',
    'password': 'xyq2525307',
    'db': 'ceshi',
    'prefix': 'ceshi_'
};


var DB = require('../com/cube/db/DB.js');
DB.init(config);


DB.model('user').task().insert({'username':'"lin"',phone:123},function(err,rows){
    if(err){
        console.log('error: '+err);
        return;
    }
    console.dir(rows);
});