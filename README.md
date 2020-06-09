# bookmarks-server

## How to Install On Your Computer
1. Clone this repo
2. In Terminal, change to the directory on your computer that contains this repo
3. Run `npm install`
4. Do the PostgreSQL "Database Info" steps (see below)
5. In Terminal, run `npm start`

## Database Info

`<<USER>>` is your database role/user. My `<<USER>>` is `dunder_mifflin`.

Steps, in Terminal, to create the PostgreSQL databases and add test data:

```
createdb -U dunder_mifflin bookmarks

npm run migrate

psql -U dunder_mifflin -d bookmarks -f ./seeds/seed.bookmarks.sql

createdb -U dunder_mifflin bookmarks-test

npm run migrate:test

psql -U dunder_mifflin -d bookmarks-test -f ./seeds/seed.bookmarks.sql
```

## Step-by-Step Instructions On How This Repo Was Created

1. Make a new express project called bookmarks-server.

```
   git https://github.com/asktami/express-boilerplate-routes.git bookmarks-server && cd $_ bookmarks-server
   rm -rf .git && git init
   mv example.env .env
   npm install
   git add -A && git commit -m 'first commit'
```

2. install packages:

```
   npm i pg    // PostgreSQL
   npm i postgrator-cli@3.2.0 -D
   npm i knex  // Knex (the SQL querybuilder)
   npm i xss
```

3. Edit `package.json`:

```
   "name": "bookmarks-server",
   "version": "0.0.1",
   ...
   "scripts": {
		"test": "mocha --require test/setup.js",
		"dev": "nodemon src/server.js",
		"migrate": "postgrator --config postgrator-config.js",
		"migrate:test": "env NODE_ENV=test npm run migrate",
		"start": "node src/server.js",
		"predeploy": "npm audit",
		"deploy": "git push heroku master"
	},
```

4.  If needed, get an API TOKEN from https://www.uuidgenerator.net/, and update the `.env` file with `API_TOKEN="YOUR-API-TOKEN"`

5.  Create a new PostgreSQL database called bookmarks with
    `createdb -U <<USER>> bookmarks`

6.  Do `npm t` and `npm run dev` to verify everything is good to go!

7.  Make migrations to manage the creation of tables and relations:

    1. create `./postgrator-config.js`

    2. add to `.env`: `DATABASE_URL="postgresql://<<USER>>@localhost/bookmarks"`

    3. the create table "do" migration: `./migrations/001.do.create_bookmarks_bookmarks.sql`. Run with `npm run migrate -- 1`

    4. the create table "undo" migration:: `./migrations/001.undo.create_bookmarks_bookmarks.sql`. Run with `npm run migrate -- 0`

    5. do **all** the migrations with `npm run migrate`

8.  Make seeding scripts to populate the tables with dummy data: `./seeds/seed.bookmarks.sql`

9.  Seed the database: `psql -U <<USER>> -d bookmarks -f ./seeds/seed.bookmarks.sql`

10. Create the Knex instance in our controller `./src/server.js`

11. Export the DATABASE_URL variable from the `./src/config.js`:

12. Write the first endpoint for GET /bookmarks in `./src/app.js` using BookmarksService from `./src/bookmarks-service.js`

13. Write express integration tests for GET /bookmarks using both supertest and knex:

    1. create a `bookmarks-test` database specifically for testing: `createdb -U <<USER> bookmarks-test`

    2. make an environmental variable to store the address for the test DB in `.env`

    3. in `postgrator-config.js` add add a ternary condition that checks the `NODE_ENV` and either uses `DATABASE_URL` or `TEST_DATABASE_URL`

    4. add a new migration script `migrate:test` that sets `NODE_ENV` to `"test"` in `package.json`

    5. migrate your test database using `npm run migrate:test`

    6. load the `.env` file in tests using `dotenv` in `./test/setup.js` so that we can access the `TEST_DATABASE_URL` from within our tests

    7. make a new file for testing the bookmarks endpoints and inserting some rows into the bookmarks_bookmarks table before the test: `./test/bookmarks-endpoints.spec.js`

## Scripts

Start the application `npm start` aka `node ./src/server.js`

Start nodemon for the application `npm run dev`

Run the tests `npm t` aka `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.
