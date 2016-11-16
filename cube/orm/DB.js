/**
 * For the sql database :).
 * You must setup the npm mysql before you use the DB.
 *
 * @package com\cube\db
 */
var mysql = require('mysql');

/**
 * orm config.
 * @type {{host: string, port: number, user: string, password: string, orm: string, prefix: string, table: string}}
 * @private
 */
var _options = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '',
    'db': 'system',
    'prefix': 'cube_',
};

/**
 * mysql connect instance.
 * @type {null}
 * @private
 */
var _connect = null;

/**
 * log storage.
 * @type {string}
 * @private
 */
var _log = '';

/**
 * core class instance.
 * @type {{init: Function, model: Function, query: Function, close: Function, log: Function}}
 */
var DB = {
    /**
     * database config.
     * {
     *  'type':'mysql',
     *  'host':'127.0.0.1',
     *  'port':3306,
     *  'user:'root',
     *  'password':'',
     *  'orm':'system',
     *  'prefix':'orm prefix such as google_x_'
     * }
     *
     * @var
     */
    init: function (value) {
        _options = value;
    },

    /**
     * create orm orm instance.
     * DB.model('list');
     *
     * @param tableName database list name
     * @return DBModel
     */
    model: function (tableName) {
        if (!_options) {
            throw new Error('No orm options.');
        }
        return new DBModel(_options['prefix'] + tableName);
    },

    /**
     * execute sql.
     * (collection returned)
     *
     * @param $sql
     * @param $task run as the task mode(default value : false)
     * @return array data collection
     */
    query: function (sql, task, callback) {
        if (_connect) {
            log(sql + ' task: ' + task);
            if (task) {
                _connect.query('BEGIN;', function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    onQuery();
                });
            } else {
                onQuery();
            }

            function onRollBack(err) {
                _connect.query('ROLLBACK;', function () {
                    callback(err);
                });
            }

            function onCommit(rows) {
                _connect.query('COMMIT;', function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, rows);
                });
            }

            function onQuery() {
                _connect.query(sql, function (err, rows) {
                    if (err) {
                        if (task) {
                            onRollBack(err);
                        } else {
                            callback(err);
                        }
                        return;
                    }
                    if (task) {
                        onCommit(rows);
                    } else {
                        callback(null, rows);
                    }
                });
            }

        } else {
            callback('connect is null');
        }
    },

    /**
     * Close the orm instance.
     * @return bool
     */
    close: function () {
        if (_connect) {
            _connect.close();
        }
        return true;
    },

    /**
     * get the orm log.
     * @returns {string}
     */
    log: function () {
        if (_log) {
            var temporaryLogs = _log;
            _log = '';
            return temporaryLogs;
        }
        return '';
    }
};
module.exports = DB;

/**
 * Class DBModel.
 * sql orm model unit.
 * @package com\cube\orm
 */
function DBModel(tableName) {
    /**
     * the state of support task.
     * @var bool
     */
    var _task = false;
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
    this.task = function () {
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
    this.where = function ($options) {
        if ($options) {
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
    this.order = function (options) {
        if (options) {
            if (options instanceof Array) {
                _order = options.join(',');
            } else {
                _order = options;
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
    this.group = function ($options) {
        if ($options) {
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
    this.limit = function ($start, $length) {
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
    this.count = function (callback) {
        var sql = 'SELECT COUNT(*)';
        sql += ' FROM '.tableName;
        if (_where) {
            sql += ' WHERE '._where;
        }
        sql += ';';
        execConnectedQuery(sql, _task, callback);
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
    this.sum = function (value, callback) {
        if (value) {
            var sql = 'SELECT SUM(' + value + ')';
            sql += ' FROM ' + tableName;
            if (_where) {
                sql += ' WHERE ' + _where;
            }
            sql += ';';
            execConnectedQuery(sql, _task, callback);
        } else {
            callback('value is null');
        }
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
    this.select = function () {
        var callback = null;
        var options = null;

        if (arguments.length == 1) {
            callback = arguments[0];
        } else if (arguments.length == 2) {
            callback = arguments[1];
            options = arguments[0];
        } else {
            throw new Error('select parameters error');
        }

        var sql = 'SELECT ';
        if (options) {
            if (options instanceof Array) {
                sql += options.join(',');
            } else {
                sql += options;
            }
        } else {
            sql += '*';
        }
        sql += ' FROM ' + tableName;
        if (_where) {
            sql += ' WHERE ' + _where;
        }
        if (_group) {
            sql += ' GROUP BY ' + _group;
        }
        if (_order) {
            sql += ' ORDER BY ' + _order;
        }
        if (_limit) {
            sql += ' LIMIT ' + _limit;
        }
        sql += ';';
        execConnectedQuery(sql, _task, callback);
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
    this.update = function (options, callback) {
        if (options) {
            var sql = 'UPDATE ' + tableName + ' SET ';
            if (options instanceof Object) {
                var sets = [];
                for (var key in options) {
                    sets.push(key + '=' + options[key]);
                }
                sql += sets.join(',');
            } else {
                sql += options;
            }
            if (_where) {
                sql += ' WHERE ' + _where;
            }
            sql += ';';
            execConnectedQuery(sql, _task, callback);
        } else {
            callback('options is null');
        }
    }

    /**
     * delete.
     *
     * DB::model('list')->where('a=1')->delete();
     * SQL:delete from list where a=1;
     *
     * @return int
     */
    this.delete = function (callback) {
        var sql = 'DELETE FROM ' + tableName;
        if (_where) {
            sql += ' WHERE ' + _where;
            sql += ';';
        }
        execConnectedQuery(sql, _task, callback);
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
    this.insert = function (options, callback) {
        if (options) {
            var sql = 'INSERT INTO ' + tableName;
            var columns = [];
            var values = [];
            for (var key in options) {
                columns.push(key);
                values.push(options[key]);
            }
            sql += ' (' + columns.join(',') + ')';

            if (_where) {
                var unique_key = _where.split('=')[0];
                sql += ' SELECT ' + values.join(',') + ' FROM DUAL WHERE NOT EXISTS(SELECT ';
                sql += unique_key + ' FROM ' + tableName + ' WHERE ' + _where + ')';
            } else {
                sql += ' VALUES (' + values.join(',') + ')';
            }
            sql += ';';
            execConnectedQuery(sql, _task, callback);
        } else {
            callback('options is null');
        }
    }
}

/**
 * execute sql by the orm-connected check.
 *
 * @param sql
 * @param task
 * @param callback
 */
function execConnectedQuery(sql, task, callback) {
    if (_connect) {
        DB.query(sql, task, callback);
    } else {
        if (_options) {
            var connect = mysql.createConnection({
                host: _options['host'],
                port: _options['port'],
                user: _options['user'],
                password: _options['password'],
                database: _options['db'],
                charset: 'utf8'
            });
            connect.connect(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                _connect = connect;
                DB.query(sql, task, callback);
            });
            connect.on('error', function () {
                _connect = null;
                callback(err);
            });
        } else {
            callback('options is null');
        }
    }
}

/**
 * append log str.
 *
 * @param value
 */
function log(value) {
    if (value) {
        var date = new Date().toUTCString();
        value = '[' + date + '] ' + value + '\n\t';
    }
    console.log(value);
    _log += value;
}