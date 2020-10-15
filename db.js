// Reference
// JS Data Type To SQL Data Type Map
// String -> sql.NVarChar
// Number -> sql.Int
// Boolean -> sql.Bit
// Date -> sql.DateTime
// Buffer -> sql.VarBinary
// sql.Table -> sql.TVP

const winston = require('winston');
const sql = require('mssql');
const { DB_PASS } = require('./utils/constants');
const config = {
    user: 'admin1',
    password: DB_PASS,
    server: 'jemm.database.windows.net',
    database: 'JEMM', 
    encrypt: true
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    winston.info('Connected to MSSQL')
    return pool
  })
  .catch(err => winston.error('Database Connection Failed! Bad Config: ', err));

async function doQuery(res, query, params, callback) {
    try {
        const pool = await poolPromise;
        let request = pool.request();

        params.forEach(function(p) {
          winston.info(p.value);
            request.input(p.name, p.sqltype, p.value);
        });
        
        let result = await request.query(query);
        callback(result);
    } catch (err) {
      winston.error(`doQuery failed due to error: ${err}`, err);
      res.status(500).send({ error: err });
    }
}

module.exports = {
  sql, poolPromise, doQuery
}