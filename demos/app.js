const express = require('@financial-times/n-express');
const chalk = require('chalk');
const errorHighlight = chalk.bold.red;
const highlight = chalk.bold.green;
const { PageKitHandlebars, helpers } = require('@financial-times/dotcom-server-handlebars');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');

const app = module.exports = express({
	name: 'public',
	systemCode: 'n-feedback-demo',
	withFlags: true,
	withHandlebars: true,
	withNavigation: false,
	withAnonMiddleware: false,
	hasHeadCss: false,
	viewsDirectory: '/demos',
	partialsDirectory: process.cwd(),
	directory: process.cwd(),
	demo: true,
	s3o: false,
});

const templateDirectory = path.join(__dirname, '../templates');
fs.readdirSync(templateDirectory).forEach(filename => {
	handlebars.registerPartial(
		`templates/${filename.substr(0, filename.lastIndexOf('.'))}`,
		fs.readFileSync(path.join(templateDirectory, filename), 'utf8')
	);
});

const rootDirectory = __dirname;
fs.readdirSync(rootDirectory).forEach(filename => {
	if (filename.includes('html')){
		handlebars.registerPartial(
			`demos/${filename.substr(0, filename.lastIndexOf('.'))}`,
			fs.readFileSync(path.join(rootDirectory, filename), 'utf8')
		);
	}
});

app.set('views', __dirname);
app.set('view engine', '.html');
app.use('/public', express.static('public'));

app.engine('.html', new PageKitHandlebars({
	cache: false,
	handlebars,
	helpers: {
		...helpers
	}
}).engine);

app.get('/', (req, res) => {
	res.render('demo', {
		title: 'Test App',
		question: 'How was your visit today?',
		type: 'radio-buttons'
	});
});

app.get('/simple', (req, res) => {
	res.render('demo-simple', {
		title: 'Test App',
		question: 'How was your visit today?',
		type: 'radio-buttons'
	});
});

function runPa11yTests () {
	const spawn = require('child_process').spawn;
	const pa11y = spawn('pa11y-ci');

	pa11y.stdout.on('data', (data) => {
		console.log(highlight(`${data}`)); //eslint-disable-line
	});

	pa11y.stderr.on('data', (error) => {
		console.log(errorHighlight(`${error}`)); //eslint-disable-line
	});

	pa11y.on('close', (code) => {
		process.exit(code);
	});
}

const listen = app.listen(5005);

if (process.env.PA11Y === 'true') {
	listen.then(runPa11yTests);
}
