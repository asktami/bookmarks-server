/*
module.exports = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'development',
	API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
	TEST_DATABASE_URL:
		process.env.TEST_DATABASE_URL ||
		'postgresql://dunder_mifflin@localhost/bookmarks-test',
	DATABASE_URL:
		process.env.DATABASE_URL || 'postgresql://dunder_mifflin@localhost/bookmarks'
};
*/

const env = process.env.NODE_ENV; // 'production' or 'test'

const production = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'production',
	API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
	DATABASE_URL:
		process.env.DATABASE_URL ||
		'postgresql://dunder_mifflin@localhost/bookmarks'
};
const test = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'test',
	API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
	DATABASE_URL:
		process.env.TEST_DATABASE_URL ||
		'postgresql://dunder_mifflin@localhost/bookmarks-test'
};

const config = {
	production,
	test
};

module.exports = config[env];
