'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'local');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, data) => fs.writeFileSync(path.join(output, file), data);
const makefile = read('Makefile');

for (const dir of ['js', 'css', 'lang']) {
	fs.mkdirSync(path.join(output, dir), { recursive: true });
}
for (const [name, target] of [['twistySrc', 'twisty.js'], ['timerSrc', 'cstimer.js']]) {
	const list = makefile.match(new RegExp(name + ' = [^\\n]*\\\\\\r?\\n([\\s\\S]*?)\\)'));
	if (!list) throw new Error('Cannot read ' + name + ' from Makefile');
	const sources = list[1].replace(/\\/g, '').trim().split(/\s+/).map(file => path.join('src', 'js', file));
	execFileSync('java', [
		'-jar', path.join('lib', 'compiler.jar'), '--use_types_for_optimization',
		'--language_out', 'STABLE', '--charset', 'UTF-8', '--strict_mode_input',
		...(name == 'timerSrc' ? ['--define=DEBUGM=false', '--define=DEBUGWK=false'] : []),
		...sources, '--js_output_file', path.join(output, 'js', target)
	], { cwd: root, stdio: 'inherit' });
}
fs.cpSync(path.join(root, 'src', 'css'), path.join(output, 'css'), { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'js', 'jquery.min.js'), path.join(output, 'js', 'jquery.min.js'));
for (const file of ['cstimer.webmanifest', 'cstimer512x512.png']) {
	fs.copyFileSync(path.join(root, 'src', file), path.join(output, file));
}
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'));

const version = execFileSync('git', ['describe', '--always', '--dirty'], { cwd: root, encoding: 'utf8' }).trim();
const langDet = read(path.join('src', 'lang', 'langDet.php'));
const langSet = langDet.match(/var LANG_SET = '([^']+)'/)[1];
const langStr = langDet.match(/var LANG_STR = '([^']+)'/)[1];
const languages = langSet.split('|').slice(1);
let template = read(path.join('dist', 'timer.php'));
template = template.slice(template.indexOf('<!DOCTYPE'));
template = template.replace(' manifest="cache.manifest"', '');
template = template.replace("<?php include('baidutongji.php') ?>", '');
const sourceLink = '<p>Personal csTimer fork: <a href="https://github.com/Zhe-hotmail/cstimer">source code</a> | <a href="LICENSE">GPL-3.0 license</a></p>';

for (const lang of languages) {
	fs.copyFileSync(path.join(root, 'src', 'lang', lang + '.js'), path.join(output, 'lang', lang + '.js'));
	const head = `<title>csTimer - F2L Training</title>
<script>
var CSTIMER_VERSION = ${JSON.stringify(version)};
var LANG_SET = ${JSON.stringify(langSet)};
var LANG_STR = ${JSON.stringify(langStr)};
var LANG_CUR = ${JSON.stringify(lang)};
(function() {
	var request = new URLSearchParams(location.search).get('lang');
	var cookie = document.cookie.match(/(?:^|;\\s*)lang=([^;]+)/);
	var preferred = (request || (cookie && cookie[1]) || navigator.language || 'en-us').toLowerCase();
	if (preferred == 'auto') preferred = navigator.language.toLowerCase();
	if (preferred == 'cn') preferred = 'zh-cn';
	var available = LANG_SET.split('|').slice(1);
	var target = available.indexOf(preferred) >= 0 ? preferred :
		available.filter(function(value) { return value.slice(0, 2) == preferred.slice(0, 2); })[0] || 'en-us';
	if (target != LANG_CUR) location.replace(target + '.html' + location.search + location.hash);
})();
</script>
<script src="lang/en-us.js"></script>
${lang == 'en-us' ? '' : '<script src="lang/' + lang + '.js"></script>'}`;
	let about = read(path.join('src', 'lang', lang + '.php'))
		.replace(/<\?php echo \$version;\s*\?>/g, version)
		.replace(/<\?php include\('(lang|color)\.php'\)\s*\?>/g, (_, name) => read(path.join('src', 'lang', name + '.php')))
		.replace(/href="\//g, 'href="https://cstimer.net/');
	const html = template.replace("<?php include('lang/langDet.php');?>", () => head)
		.replace("<?php include('lang/'.$lang.'.php') ?>", () => sourceLink + about);
	if (html.includes('<?php')) throw new Error('Unprocessed PHP in ' + lang);
	write(lang + '.html', html);
	if (lang == 'en-us') write('index.html', html);
}
// No caching yet: local iteration and first deployments must not retain stale application bundles.
write('sw.js', "self.addEventListener('install', function() { self.skipWaiting(); });\n");
write('.nojekyll', '');
console.log('Static site: ' + output);
