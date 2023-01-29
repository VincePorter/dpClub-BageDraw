// * third-party modules
const mariadb = require('mariadb');

// * environment variables
const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 5,
});

// * connect and check for errors
pool.getConnection((err, connection) => {
	if (err) {
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			console.log('Database connection lost!');
		}
		if (err.code === 'ER_GET_CONNECTION_TIMEOUT') {
			console.log('Database connection timed out!');
		}
		if (err.code === 'ER_CON_COUNT_ERROR') {
			console.log('Database has too many connections!');
		}
		if (err.code === 'ECONNREFUSED') {
			console.log('Database connection was refused!');
		}
	}
	if (connection) connection.release();

	return;
});

module.exports = pool;
