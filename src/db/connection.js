const mysql = require("mysql2/promise");
const { env } = require("../env");

const pool = mysql.createPool({
  host: env.MYSQL_HOST || "localhost",
  user: env.MYSQL_USER || "root",
  password: env.MYSQL_PASSWORD || "",
  database: env.MYSQL_DATABASE || "techcheck",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
