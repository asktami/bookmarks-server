const knex = require('knex');
const {
	makeBookmarksArray,
	makeMaliciousBookmark
} = require('./bookmarks-fixtures');
const app = require('../src/app');

describe('Bookmarks Endpoints', function() {
	let db;

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL
		});
		app.set('db', db);
	});

	after(`disconnect from ${process.env.TEST_TABLE} db`, () => db.destroy());

	before(`cleanup the ${process.env.TEST_TABLE} table`, () =>
		db(process.env.TEST_TABLE).truncate()
	);

	afterEach(`${process.env.TEST_TABLE} cleanup`, () =>
		db(process.env.TEST_TABLE).truncate()
	);

	describe(`Unauthorized requests`, () => {
		const testBookmarks = makeBookmarksArray();

		beforeEach('insert `${process.env.TEST_TABLE}`', () => {
			return db.into(`${process.env.TEST_TABLE}`).insert(testBookmarks);
		});

		it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
			return supertest(app)
				.get('/api/bookmarks')
				.expect(401, { error: 'Unauthorized request' });
		});

		it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
			return supertest(app)
				.post('/api/bookmarks')
				.send({
					title: 'test-title',
					url: 'http://some.thing.com',
					rating: 1
				})
				.expect(401, { error: 'Unauthorized request' });
		});

		it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
			// const item = store.bookmarks[1];
			const item = testBookmarks[1];
			return supertest(app)
				.get(`/api/bookmarks/${item.id}`)
				.expect(401, { error: 'Unauthorized request' });
		});

		it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
			// const item = store.bookmarks[1];
			const item = testBookmarks[1];
			return supertest(app)
				.delete(`/api/bookmarks/${item.id}`)
				.expect(401, { error: 'Unauthorized request' });
		});
	});

	// ************************
	describe(`GET /api/bookmarks`, () => {
		context(
			`Given no items in ${process.env.TEST_DB} database, ${process.env.TEST_TABLE} table`,
			() => {
				it(`responds with 200 and an empty list`, () => {
					return supertest(app)
						.get('/api/bookmarks')
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(200, []);
				});
			}
		);

		context(
			`Given there are items in the ${process.env.TEST_DB} database, ${process.env.TEST_TABLE} table`,
			() => {
				const testBookmarks = makeBookmarksArray();

				beforeEach('insert bookmarks', () => {
					return db.into(process.env.TEST_TABLE).insert(testBookmarks);
				});

				it('GET /api/bookmarks responds with 200 and all of the items', () => {
					return supertest(app)
						.get('/api/bookmarks')
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(200, testBookmarks);
				});
			}
		);

		// sanitize
		context(`Given an XSS attack bookmark`, () => {
			const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

			beforeEach('insert malicious bookmark', () => {
				return db.into(process.env.TEST_TABLE).insert([maliciousBookmark]);
			});

			it('removes XSS attack content', () => {
				return supertest(app)
					.get(`/api/bookmarks`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(200)
					.expect(res => {
						expect(res.body[0].title).to.eql(expectedBookmark.title);
						expect(res.body[0].description).to.eql(
							expectedBookmark.description
						);
					});
			});
		});

		// ************************
		describe(`GET /api/bookmarks/:id`, () => {
			context(
				`Given no items in the ${process.env.TEST_DB} database, ${process.env.TEST_TABLE} table`,
				() => {
					it(`responds with 404 when item does not exist`, () => {
						const id = 1;
						return supertest(app)
							.get(`/api/bookmarks/${id}`)
							.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
							.expect(404, { error: { message: `Bookmark Not Found` } });
					});
				}
			);

			context(
				`Given there are items in ${process.env.TEST_DB} database, ${process.env.TEST_TABLE} table`,
				() => {
					const testBookmarks = makeBookmarksArray();

					beforeEach('insert items', () => {
						return db.into(process.env.TEST_TABLE).insert(testBookmarks);
					});

					it('responds with 200 and the specified item', () => {
						const id = 1;
						const expected = testBookmarks[id - 1];
						return supertest(app)
							.get(`/api/bookmarks/${id}`)
							.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
							.expect(200, expected);
					});
				}
			);

			// **********************************************
			context(`Given an XSS attack bookmark`, () => {
				const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

				beforeEach('insert malicious item', () => {
					return db.into(process.env.TEST_TABLE).insert([maliciousBookmark]);
				});

				it('removes XSS attack content', () => {
					return supertest(app)
						.get(`/api/bookmarks/${maliciousBookmark.id}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(200)
						.expect(res => {
							expect(res.body.title).to.eql(expectedBookmark.title);
							expect(res.body.description).to.eql(expectedBookmark.description);
						});
				});
			});
		});

		// ************************
		describe('DELETE /api/bookmarks/:id', () => {
			context(`Given no items`, () => {
				it(`responds 404 when item doesn't exist`, () => {
					return supertest(app)
						.delete(`/api/bookmarks/123`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(404, {
							error: { message: `Bookmark Not Found` }
						});
				});
			});

			context('Given there are items in the database', () => {
				const testBookmarks = makeBookmarksArray();

				beforeEach('insert items', () => {
					return db.into(process.env.TEST_TABLE).insert(testBookmarks);
				});

				it('removes the item by ID from the store', () => {
					const idToRemove = 2;
					const expectedItems = testBookmarks.filter(
						bm => bm.id !== idToRemove
					);
					return supertest(app)
						.delete(`/api/bookmarks/${idToRemove}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(204)
						.then(() =>
							supertest(app)
								.get(`/api/bookmarks`)
								.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
								.expect(expectedItems)
						);
				});
			});
		});

		// ************************
		describe('POST /api/bookmarks', () => {
			it(`responds with 400 missing 'title' if not supplied`, () => {
				const newBookmarkMissingTitle = {
					// title: 'test-title',
					url: 'https://test.com',
					rating: 1
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmarkMissingTitle)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(400, {
						error: { message: `'title' is required` }
					});
			});

			it(`responds with 400 missing 'url' if not supplied`, () => {
				const newBookmarkMissingUrl = {
					title: 'test-title',
					// url: 'https://test.com',
					rating: 1
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmarkMissingUrl)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(400, {
						error: { message: `'url' is required` }
					});
			});

			it(`responds with 400 missing 'rating' if not supplied`, () => {
				const newBookmarkMissingRating = {
					title: 'test-title',
					url: 'https://test.com'
					// rating: 1,
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmarkMissingRating)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(400, {
						error: { message: `'rating' is required` }
					});
			});

			it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
				const newBookmarkInvalidRating = {
					title: 'test-title',
					url: 'https://test.com',
					rating: 'invalid'
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmarkInvalidRating)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(400, {
						error: { message: `'rating' must be a number between 0 and 5` }
					});
			});

			it(`responds with 400 invalid 'url' if not a valid URL`, () => {
				const newBookmarkInvalidUrl = {
					title: 'test-title',
					url: 'htp://invalid-url',
					rating: 1
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmarkInvalidUrl)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(400, {
						error: { message: `'url' must be a valid URL` }
					});
			});

			it('adds a new bookmark to the store', () => {
				const newBookmark = {
					title: 'test-title',
					url: 'https://test.com',
					description: 'test description',
					rating: 1
				};
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(newBookmark)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(201)
					.expect(res => {
						expect(res.body.title).to.eql(newBookmark.title);
						expect(res.body.url).to.eql(newBookmark.url);
						expect(res.body.description).to.eql(newBookmark.description);
						expect(res.body.rating).to.eql(newBookmark.rating);
						expect(res.body).to.have.property('id');
						expect(res.headers.location).to.eql(
							`/api/bookmarks/${res.body.id}`
						);
					})
					.then(res =>
						supertest(app)
							.get(`/api/bookmarks/${res.body.id}`)
							.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
							.expect(res.body)
					);
			});

			it('FIX: removes XSS attack content from response', () => {
				const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
				return supertest(app)
					.post(`/api/bookmarks`)
					.send(maliciousBookmark)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(201)
					.expect(res => {
						expect(res.body.title).to.eql(expectedBookmark.title);
						expect(res.body.description).to.eql(expectedBookmark.description);
					});
			});
		});

		// ************************
		/*
	- Add an endpoint to support updating bookmarks using a PATCH request

	- Ensure the Bookmarks API has a uniform RESTful interface. For example, are the endpoints consistently named?

	- Update all of the endpoints to use the /api prefix

	- Write integration tests for your PATCH request to ensure:
        It requires the bookmark's ID to be supplied as a URL param
        It responds with a 204 and no content when successful
        It updates the bookmark in your database table
        It responds with a 400 when no values are supplied for any fields (title, url, description, rating)
        It allows partial updates, for example, only supplying a new title will only update the title for that item

	- Write the appropriate API code to make these tests pass
	*/
		describe(`PATCH /api/bookmarks/:id`, () => {
			context(`Given no bookmarks`, () => {
				it(`responds with 404`, () => {
					const bookmarkId = 123456;
					return supertest(app)
						.patch(`/api/bookmarks/${bookmarkId}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.expect(404, { error: { message: `Bookmark Not Found` } });
				});
			});

			context('Given there are bookmarks in the database', () => {
				const testBookmarks = makeBookmarksArray();

				beforeEach('insert bookmarks', () => {
					return db.into(process.env.TEST_TABLE).insert(testBookmarks);
				});

				it('responds with 204 and updates the bookmark', () => {
					const idToUpdate = 2;
					const updateBookmark = {
						title: 'updated bookmark title',
						url: 'http://www.updated.com',
						description: 'updated bookmark description',
						rating: 5
					};
					const expectedBookmark = {
						...testBookmarks[idToUpdate - 1],
						...updateBookmark
					};
					return supertest(app)
						.patch(`/api/bookmarks/${idToUpdate}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.send(updateBookmark)
						.expect(204)
						.then(res =>
							supertest(app)
								.get(`/api/bookmarks/${idToUpdate}`)
								.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
								.expect(expectedBookmark)
						);
				});

				it(`responds with 400 when no required fields supplied`, () => {
					const idToUpdate = 2;
					return supertest(app)
						.patch(`/api/bookmarks/${idToUpdate}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.send({ irrelevantField: 'foo' })
						.expect(400, {
							error: {
								message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
							}
						});
				});

				it(`responds with 204 when updating only a subset of fields`, () => {
					const idToUpdate = 2;
					const updateBookmark = {
						title: 'updated bookmark title'
					};
					const expectedBookmark = {
						...testBookmarks[idToUpdate - 1],
						...updateBookmark
					};

					return supertest(app)
						.patch(`/api/bookmarks/${idToUpdate}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.send({
							...updateBookmark,
							fieldToIgnore: 'should not be in GET response'
						})
						.expect(204)
						.then(res =>
							supertest(app)
								.get(`/api/bookmarks/${idToUpdate}`)
								.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
								.expect(expectedBookmark)
						);
				});

				// ********************

				it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
					const idToUpdate = 2;
					const updateInvalidRating = {
						rating: 'invalid'
					};
					return supertest(app)
						.patch(`/api/bookmarks/${idToUpdate}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.send(updateInvalidRating)
						.expect(400, {
							error: {
								message: `'rating' must be a number between 0 and 5`
							}
						});
				});

				it(`responds with 400 invalid 'url' if not a valid URL`, () => {
					const idToUpdate = 2;
					const updateInvalidUrl = {
						url: 'htp://invalid-url'
					};
					return supertest(app)
						.patch(`/api/bookmarks/${idToUpdate}`)
						.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
						.send(updateInvalidUrl)
						.expect(400, {
							error: {
								message: `'url' must be a valid URL`
							}
						});
				});

				// *************************
			});
		});
	});
});
