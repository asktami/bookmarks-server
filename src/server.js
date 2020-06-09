const knex = require('knex');
const app = require('./app');
const { PORT, DATABASE_URL } = require('./config');

const db = knex({
	client: 'pg',
	connection: DATABASE_URL
});

app.set('db', db);

console.log('NODE_ENV = ', process.env.NODE_ENV);
console.log('DATABASE_URL = ', DATABASE_URL);

// to DEBUG database connection
console.log('----------------');

const qry = db
	.select('*')
	.from(`bookmarks`)
	.toQuery();

const conn = db.select('*').from(`bookmarks`);

const rows = db
	.select('*')
	.from(`bookmarks`)
	.then(result => {
		console.log('rows = ', result);
	});

console.log(qry);
console.log(conn.client.connectionSettings);

console.log('----------------');

app.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}`);
});
