function makeBookmarksArray() {
	return [
		{
			id: 1,
			title: 'Google',
			url: 'http://www.google.com',
			description: 'Google bookmark',
			rating: 5,
			created_on: '2029-01-22T16:28:32.615Z'
		},
		{
			id: 2,
			title: 'Bing',
			url: 'http://www.bing.com',
			description: 'Bing bookmark',
			rating: 3,
			created_on: '2100-05-22T16:28:32.615Z'
		}
	];
}
function makeMaliciousBookmark() {
	const maliciousBookmark = {
		id: 911,
		title: 'Naughty naughty very naughty <script>alert("xss");</script>',
		url: 'https://www.hackers.com',
		description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
		rating: '1'
	};
	const expectedBookmark = {
		...maliciousBookmark,
		title:
			'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
		description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
	};
	return {
		maliciousBookmark,
		expectedBookmark
	};
}

module.exports = {
	makeBookmarksArray,
	makeMaliciousBookmark
};
