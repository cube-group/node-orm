var config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'db': 'system',
    'prefix': 'cube_'
};

var DB = require('../com/cube/db/DB.js');
DB.init(config);

////insert as the task.
//DB.model('user').task().insert({'username': '"lin"', phone: 123}, function (err, rows) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});

////select
DB.model('user').select(function (err, rows) {
    if (err) {
        console.log(err);
        return;
    }
    console.dir(rows);
});

//update
//DB.model('user').where('username="lin"').update({'phone': 123}, function (err, rows) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});
//
////delete
//DB.model('user').where('phone=123').delete(function (err, rows) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});
//
//order
//DB.model('user').order('username ASC').select(function(err,rows){
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});
//
//group
//DB.model('user').group('username').select(function(err,rows){
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});
//
//limit
//DB.model('user').limit(0,2).select('username',function(err,rows){
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});


//unique insert.
//DB.model('user').where('username="hello"').insert({'username': '"hello"', phone: 123}, function (err, rows) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    console.dir(rows);
//});