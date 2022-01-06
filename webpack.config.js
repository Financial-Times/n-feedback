const BowerResolvePlugin = require('bower-resolve-webpack-plugin');
const path = require('path');

module.exports = {
	entry: './demos/src/main.js',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'main.js'
	},
	resolve: {
		plugins: [
			// This will handle a bower.json's `main` property being an array.
			new BowerResolvePlugin()
		],

		// In which folders the resolver look for modules relative paths are
		// looked up in every parent folder (like node_modules) absolute
		// paths are looked up directly the order is respected
		modules: ['bower_components', 'node_modules'],

		// These JSON files are read in directories
		descriptionFiles: ['bower.json', 'package.json'],

		// These fields in the description files are looked up when trying to resolve the package directory
		mainFields: ['main', 'browser'],

		// These files are tried when trying to resolve a directory
		mainFiles: ['index', 'main'],

		// These fields in the description files offer aliasing in this package
		// The content of these fields is an object where requests to a key are mapped to the corresponding value
		aliasFields: ['browser']
	},
};
