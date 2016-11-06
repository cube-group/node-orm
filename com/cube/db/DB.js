/**
 * For the sql database :).
 * You must setup the npm mysql before you use the DB.
 *
 * @package com\cube\db
 */
var mysql = require('mysql');

var _options = {
    'host':'127.0.0.1',
    'port':3306,
    'user':'root',
    'password':'',
    'db':'system',
    'prefix':'cube_',
    'table':''
};
var _connect = null;


var DB = {
    /**
     * database config.
     * array(
     *  'type'=>'mysql',
     *  'host'=>'127.0.0.1',
     *  'port'=>3306,
     *  'user'=>'root',
     *  'password'=>'',
     *  'db'=>'system',
     *  'prefix'=>'db prefix such as google_x_'
     * )
     *
     * @var
     */
    init:function(value){
        _options = value;
    },

    /**
     * create db orm instance.
     * DB::model('list');
     *
     * @param $name database list name
     * @return DBModel
     */
    model:function(name) {
        if (!_options) {
            throw new Error('No db options.');
        }
        _options['table'] = name;
        return new DBModel();
    },

    /**
     * execute sql.
     * (collection returned)
     *
     * @param $sql
     * @param $task run as the task mode(default value : false)
     * @return array data collection
     */
    query:function(sql, task,callback) {
        if(_connect){
            _connect.query(sql,function(err,rows,fields){
                if(err){
                    callback(err);
                    return;
                }
                callback(null,rows,fields);
            });
        }
        callback('connect is null');
    },

    /**
     * Close the orm instance.
     * @return bool
     */
    close:function() {
        if(_connect){
            _connect.close();
        }
        return true;
    }
}


/**
 * Class DBModel.
 * sql orm model unit.
 * @package com\cube\db
 */
function DBModel(tableName)
{
    /**
     * the state of support task.
     * @var bool
     */
    var _task = false;
    /**
     * the name of the table.
     * @var string
     */
    var _table_name = '';
    /**
     * sql where string.
     * @var string
     */
    var _where = '';
    /**
     * sql order string.
     * @var string
     */
    var _order = '';
    /**
     * sql group string.
     * @var string
     */
    var _group = '';
    /**
     * sql limit string.
     * @var string
     */
    var _limit = '';

    /**
     * the orm action as the task.
     *
     * DB::model('list')->task()->insert(array('a'=>1));
     * SQL:insert into list (a) values (1);
     * @return mixed
     */
    this.task = function() {
        _task = true;
        return this;
    }

    /**
     * where.
     *
     * DB::model('list')->where('a=1 and (b=2 or c=3)')->select();
     * SQL:select * from list where a=1 and (b=2 or c=3);
     *
     * @param $options
     * @return $this
     */
    this.where = function($options) {
        if (!$options && $options!='') {
           _where = $options;
        }
        return this;
    }

    /**
     * select by the order.
     *
     * DB::model('list')->order('userid ASC')->select();
     * SQL:select * from list order by userid asc;
     *
     * DB::model('list')->order(array('userid ASC','username DESC'))->select();
     * SQL:select * from list order by userid asc,username desc;
     *
     * @param $options
     * @return $this
     */
    this.order = function($options) {
        if (!$options && $options!='') {
            if ($options instanceof Array) {
                _order = $options.join(',');
            } else {
                _order = $options;
            }
        }
        return this;
    }

    /**
     * select by the group.
     *
     * DB::model('list')->group('userid')->select();
     * SQL:select * from list group by userid;
     *
     * DB::model('list')->group(array('userid','username'))->select();
     * SQL:select * from list group by userid,username;
     *
     * @param $options
     * @return $this
     */
    this.group = function($options)
    {
        if (!$options && $options!='') {
            if ($options instanceof Array) {
                _group = $options.join(',');
            } else {
                _group = $options;
            }
        }
        return this;
    }

    /**
     * limit pages.
     *
     * DB::model('list')->limit(0,10)->select();
     * SQL:select * from list limit 0,10;
     *
     * @param $start
     * @param $length
     * @return $this
     */
    this.limit = function($start, $length) {
        if ($start >= 0 && $length > 0) {
            _limit = $start + ',' + $length;
        }
        return this;
    }

    /**
     * get the count of the select.
     *
     * DB::model('list')->count();
     * SQL:select count(*) from list;
     *
     * DB::model('list')->where('a=1')->count();
     * SQL:select count(*) from list where a=1;
     *
     * @return array
     */
    this.count = function(callback)
    {
        var sql = 'SELECT COUNT(*)';
        sql += ' FROM ' . tableName;
        if (!_where && _where!='') {
            sql += ' WHERE ' . _where;
        }
        sql += ';';
        getConnection(function(err){
            if(err){
                callback(err);
                return;
            }
            DB.query(sql,_task,callback);
        });
    }

    /**
     * 查询符合当前sql的和.
     *
     * DB::model('list')->sum('score');
     * SQL:select sum(score) from list;
     *
     * DB::model('list')->where('a=1')->sum('score');
     * SQL:select sum(score) from list where a=1;
     *
     * @param $value
     * @return array|int
     */
    this.sum = function(value,callback) {
        if (empty($value)) {
            return -1;
        }
        $sql = 'SELECT SUM(' . $value . ')';
        $sql .= ' FROM ' . $this->_table_name;
        if (!empty($this->_where)) {
            $sql .= ' WHERE ' . $this->_where;
        }
        $sql .= ';';
        return DB::query($sql, $this->_task);
    }

    /**
     * select.
     *
     * DB::model('list')->select();
     * SQL:select * FROM list;
     *
     * DB::model('list')->select('username');
     * SQL:select username from list;
     *
     * DB::model('list')->select(array('username','team'));
     * SQL:select username,team from list;
     *
     * @param null $options
     * @return array
     */
    public function select($options = null)
    {
        $sql = 'SELECT ';
        if (!empty($options)) {
            if (is_array($options) && count($options) > 0) {
                $sql .= join(',', $options);
            } else {
                $sql .= $options;
            }
        } else {
            $sql .= '*';
        }
        $sql .= ' FROM ' . $this->_table_name;
        if (!empty($this->_where)) {
            $sql .= ' WHERE ' . $this->_where;
        }
        if (!empty($this->_group)) {
            $sql .= ' GROUP BY ' . $this->_group;
        }
        if (!empty($this->_order)) {
            $sql .= ' ORDER BY ' . $this->_group;
        }
        if (!empty($this->_limit)) {
            $sql .= ' LIMIT ' . $this->_group;
        }
        $sql .= ';';
        return DB::query($sql, $this->_task);
    }

    /**
     * update.
     *
     * DB::model('list')->where('a=1 and b="world"')->update(array('c'=>2,'d'=>'"hello"'));
     * SQL:update list c=2,d="hello" where a=1 and b="world";
     *
     * @param $options
     * @return int
     */
    public function update($options)
    {
        $sql = 'UPDATE ' . $this->_table_name . ' SET ';
        if (!empty($options) && is_array($options) && count($options) > 0) {
            $sets = array();
            foreach ($options as $key => $value) {
                array_push($sets, $key . '=' . $value);
            }
            $sql .= join(',', $sets);
        } else {
            return false;
        }
        if (!empty($this->_where)) {
            $sql .= ' WHERE ' . $this->_where;
        }
        $sql .= ';';
        return DB::exec($sql, $this->_task);
    }

    /**
     * delete.
     *
     * DB::model('list')->where('a=1')->delete();
     * SQL:delete from list where a=1;
     *
     * @return int
     */
    public function delete()
    {
        $sql = 'DELETE FROM ' . $this->_table_name;
        if (!empty($this->_where)) {
            $sql .= ' WHERE ' . $this->_where;
            $sql .= ';';
        }
        return DB::exec($sql, $this->_task);
    }

    /**
     * insert action.
     *
     * DB::model('list')->where('a=1')->insert(array('a'=>1,'c'='2'));
     * SQL:insert into list (a,c) values (1,2);
     *
     * DB::model('list')->insert(array('a'=>1,'b'=>2));
     * SQL:INSERT INTO list (a,b) SELECT (1,2) FROM VISUAL WHERE NOT EXISTS (SELECT * FROM list WHERE name="hello");
     *
     * @param $options
     * @return int
     */
    public function insert($options)
    {
        $sql = 'INSERT INTO ' . $this->_table_name;
        if (!empty($options) && is_array($options) && count($options) > 0) {
            $columns = array();
            $values = array();
            foreach ($options as $key => $value) {
                array_push($columns, $key);
                array_push($values, $value);
            }
            $sql .= ' (' . join(',', $columns) . ')';

            if (!empty($this->_where)) {
                $unique_key = explode('=', $this->_where)[0];
                $sql .= ' SELECT (' . join(',', $values) . ') FROM DUAL WHERE NOT EXISTS(SELECT ';
                $sql .= $unique_key . ' FROM ' . $this->_table_name . ' WHERE ' . $this->_where . ')';
            } else {
                $sql .= ' VALUES (' . join(',', $values) . ')';
            }
            $sql .= ';';
        } else {
            return false;
        }
        return DB::exec($sql, $this->_task);
    }
}


function getConnection(callback) {
    if (!_connect) {
        try {
            var connect = mysql.createConnection({
                host:_options['host'],
                port:_options['port'],
                user:_options['user'],
                password:_options['password'],
                database:_options['db'],
                charset:'utf-8'
            });
            connect.connect(function(err){
                if(err){
                    callback(err);
                    return;
                }
                _connect = connect;
                callback(null);
            });
        } catch (e) {
            callback(e.getMessage());
        }
    }else{
        callback(null);
    }
}

final class Log
{
    private static $logs = '';

    public static function mysql($value)
    {
        self::$logs .= $value . '\n\t';
    }

    public static function getLog()
    {
        return self::$logs;
    }
}
