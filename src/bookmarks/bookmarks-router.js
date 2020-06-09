const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const validUrl = require('valid-url');

const BookmarksService = require('./bookmarks-service');
const { getBookmarkValidationError } = require('./bookmark-validator');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
	id: bookmark.id,
	title: xss(bookmark.title),
	url: bookmark.url,
	description: xss(bookmark.description),
	rating: Number(bookmark.rating),
	created_on: bookmark.created_on
});

bookmarksRouter
	.route('/')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db');
		BookmarksService.getAllBookmarks(knexInstance)
			.then(bookmarks => {
				res.json(bookmarks.map(serializeBookmark));
			})
			.catch(next);
	})
	.post(jsonParser, (req, res, next) => {
		const { title, url, description, rating } = req.body;
		const newBookmark = { title, url, description, rating };

		const knexInstance = req.app.get('db');

		for (const field of ['title', 'url', 'rating']) {
			if (!req.body[field]) {
				logger.error({
					message: `${field} is required`,
					request: `${req.originalUrl}`,
					method: `${req.method}`,
					ip: `${req.ip}`
				});
				return res.status(400).send({
					error: { message: `'${field}' is required` }
				});
			}
		}

		const error = getBookmarkValidationError(newBookmark);
		if (error) {
			logger.error({
				message: `POST Validation Error`,
				request: `${req.originalUrl}`,
				method: `${req.method}`,
				ip: `${req.ip}`
			});
			return res.status(400).send(error);
		}

		/*
		const ratingNum = Number(rating);

		if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
			logger.error({
				message: `Invalid rating '${rating}' supplied`,
				request: `${req.originalUrl}`,
				method: `${req.method}`,
				ip: `${req.ip}`
			});
			return res.status(400).send({
				error: { message: `'rating' must be a number between 0 and 5` }
			});
		}

		if (!validUrl.isWebUri(url)) {
			logger.error({
				message: `Invalid url '${url}' supplied`,
				request: `${req.originalUrl}`,
				method: `${req.method}`,
				ip: `${req.ip}`
			});
			return res.status(400).send({
				error: { message: `'url' must be a valid URL` }
			});
		}
		*/

		BookmarksService.insertBookmark(knexInstance, newBookmark)
			.then(bookmark => {
				logger.info({
					message: `Bookmark with id ${bookmark.id} created.`,
					request: `${req.originalUrl}`,
					method: `${req.method}`,
					ip: `${req.ip}`
				});
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
					.json(serializeBookmark(bookmark));
			})
			.catch(next);
	});

bookmarksRouter
	.route('/:id')
	.all((req, res, next) => {
		const { id } = req.params;
		const knexInstance = req.app.get('db');
		BookmarksService.getById(knexInstance, id)
			.then(bookmark => {
				if (!bookmark) {
					logger.error({
						message: `Bookmark with id ${id} not found.`,
						request: `${req.originalUrl}`,
						method: `${req.method}`,
						ip: `${req.ip}`
					});
					return res.status(404).json({
						error: { message: `Bookmark Not Found` }
					});
				}
				res.bookmark = bookmark;
				next();
			})
			.catch(next);
	})
	.get((req, res) => {
		res.json(serializeBookmark(res.bookmark));
	})
	.delete((req, res, next) => {
		const { id } = req.params;
		const knexInstance = req.app.get('db');
		BookmarksService.deleteBookmark(knexInstance, id)
			.then(numRowsAffected => {
				logger.info({
					message: `Bookmark with id ${id} deleted.`,
					request: `${req.originalUrl}`,
					method: `${req.method}`,
					ip: `${req.ip}`
				});

				res.status(204).end();
			})
			.catch(next);
	})
	.patch(jsonParser, (req, res, next) => {
		const knexInstance = req.app.get('db');
		const { id } = req.params;
		const { title, url, description, rating } = req.body;
		const bookmarkToUpdate = { title, url, description, rating };

		const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
			.length;
		if (numberOfValues === 0) {
			logger.error({
				message: `Invalid update without required fields`,
				request: `${req.originalUrl}`,
				method: `${req.method}`,
				ip: `${req.ip}`
			});
			return res.status(400).json({
				error: {
					message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
				}
			});
		}

		const error = getBookmarkValidationError(bookmarkToUpdate);
		if (error) {
			logger.error({
				message: `PATCH Validation Error`,
				request: `${req.originalUrl}`,
				method: `${req.method}`,
				ip: `${req.ip}`
			});
			return res.status(400).send(error);
		}

		BookmarksService.updateBookmark(knexInstance, id, bookmarkToUpdate)
			.then(numRowsAffected => {
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = bookmarksRouter;
