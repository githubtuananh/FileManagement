const mysql = require("mysql");
const util = require("util");


const db_host = "localhost";
const db_user = "root";
const db_password = '';
const database = "test";


let connection;

const getConnection = () => {
    if(!connection){
        console.log("Create new DB connection");
        connection = mysql.createConnection({
            host: db_host,
            user: db_user,
            password: db_password,
            database: database
        })
        connection.connect((err) => {
            if(err){
                console.log("Connect Faild");
            };
        })
    }

    console.log("Return DB connection");
    return connection;
}

const getQuery = () => {
    const dbConnection = getConnection();
    return util.promisify(dbConnection.query).bind(dbConnection);
}

module.exports = {getQuery}