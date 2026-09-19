'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..', 'dist', 'local');
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'static entrypoint is generated');
for (const lang of ['index', 'en-us', 'zh-cn']) {
	const html = fs.readFileSync(path.join(root, lang + '.html'), 'utf8');
	assert.ok(!html.includes('<?php'), 'no PHP left in ' + lang);
	assert.ok(html.includes('LANG_CUR'), 'language initialized');
	assert.ok(html.includes('LICENSE'), 'license linked');
	for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
		const target = match[1];
		if (/^(?:[a-z]+:|#|\?)/i.test(target)) continue;
		assert.ok(!target.startsWith('/'), 'assets must work below a project subpath: ' + target);
		assert.ok(fs.existsSync(path.join(root, target)), 'local asset exists: ' + target);
	}
}
assert.ok(fs.existsSync(path.join(root, 'js', 'twisty.js')), 'lazy loaded renderer exists');
assert.ok(fs.existsSync(path.join(root, 'sw.js')), 'service worker registration target exists');
console.log('Static entrypoints, languages, license and project-relative assets passed');
