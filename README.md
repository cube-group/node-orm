# node-orm
mysql orm on nodejs

## how to use it?
```javascript
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


DB.model('user').task().insert({'username':'"lin"',phone:123},function(err,rows){
    if(err){
        console.log('error: '+err);
        return;
    }
    console.dir(rows);
});
```

## DB
*  init(options);// init db config
*  model(tableName);//return the DBModel Class Instance
*  query(sql,task,callback);
*  close();return bool

## DBModel
*  construct(tableName);
*  task(); // return the DBModel ,the sql will executed as the task when you use this
*  where(options);//return the DBModel
*  order(options);//return the DBModel
*  group(options);//return the DBModel
*  limit(start,length);//return the DBModel
*  count(callback);// return the result
*  sum(options,callback);// return the result
*  select(options,callback);// return the result
*  update(options,callback);// return the result
*  delete(options,callback);// return the result
*  insert(options,callback);// return the result

## result
* select return rows
```javascript
ceshi_user
[ RowDataPacket { id: 5, username: 'lin', password: '', phone: '555' },
  RowDataPacket { id: 6, username: 'l', password: '', phone: null },
  RowDataPacket { id: 12, username: 'lin1', password: '', phone: null },
  RowDataPacket { id: 13, username: 'linyang', password: '', phone: null },
  RowDataPacket { id: 14, username: 'dabao', password: '', phone: '159' },
  RowDataPacket { id: 17, username: 'lin', password: '', phone: '123' } ]
```
* insert/update/delete return rows
```javascript
OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 18,
  serverStatus: 3,
  warningCount: 1,
  message: '',
  protocol41: true,
  changedRows: 0 }
```

## More demos.
*  where
```javascript
DB.model('list').where('a=1 and (b=2 or c=3)').select(callback);
SQL:select * from list where a=1 and (b=2 or c=3);
Attension:where you c='string' , you should use where('c="string"');
```
*  order
```javascript
DB.model('list').order('userid ASC').select(callback);
SQL:select * from list order by userid asc;

DB.model('list').order(['userid ASC','username DESC']).select(callback);
SQL:select * from list order by userid asc,username desc;
```
*  group
```javascript
DB.model('list').group('userid').select(callback);
SQL:select * from list group by userid;

DB.model('list').group(['userid','username']).select(callback);
SQL:select * from list group by userid,username;
```
* limit
```javascript
DB.model('list').limit(0,10).select(callback);
SQL:select * from list limit 0,10;
```
* count
```javascript
DB.model('list').count(callback);
SQL:select count(*) from list;

DB.model('list').where('a=1').count(callback);
SQL:select count(*) from list where a=1;
```
* sum
```javascript
DB.model('list').sum('score',callback);
SQL:select sum(score) from list;

DB.model('list').where('a=1').sum('score',callback);
SQL:select sum(score) from list where a=1;
```
* select
```javascript
DB.model('list').select(callback);
SQL:select * FROM list;

DB.model('list').select('username',callback);
SQL:select username from list;

DB.model('list').select(['username','team'],callback);
SQL:select username,team from list;
```
* update
```javascript
DB.model('list').where('a=1 and b="world"').update({'c':2,'d':'"hello"'},callback);
SQL:update list c=2,d="hello" where a=1 and b="world";
```
* delete
```javascript
DB.model('list').where('a=1').delete(callback);
SQL:delete from list where a=1;
```
* insert
```javascript
DB.model('list').insert({'a':1,'b':2},callback);
SQL:insert into list (a,b) values (1,2);

DB.model('list').where('a="hello"').insert({'a':1,'b':'2'},callback);
SQL:INSERT INTO list (a,b) SELECT 1,2 FROM VISUAL WHERE NOT EXISTS (SELECT * FROM list WHERE name="hello");
```
