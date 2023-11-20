const path = require('path');
const { PageKitBasePlugin } = require('@financial-times/dotcom-build-base');
const { PageKitSassPlugin } = require('@financial-times/dotcom-build-sass');
const { PageKitJsPlugin } = require('@financial-times/dotcom-build-js');

module.exports = {
	mode: 'development',
	entry: {
		scripts: './demos/src/main.js',
		styles: './demos/src/demo.scss',
	},
	plugins: [
		new PageKitBasePlugin(),
		new PageKitJsPlugin(),
		new PageKitSassPlugin({
			// Enabling webpackImporter because Sass itself can only resolve partial files based on the
			// CWD and not relative to the current file being processed. This means Sass can't find the
			// nested dependencies created when symlinking.
			webpackImporter: true,
			includePaths: [
				path.resolve('node_modules'),
				path.resolve(__dirname, 'n-feedback'),
			]
		})
	]
};
