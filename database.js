var mysql = require('mysql');
const connection = mysql.createConnection({
    host:"localhost",
    database:'susdb',
    user:'root',
    password:'password',
});
module.exports = connection;