node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

unit-test:
	NODE_OPTIONS='--no-experimental-fetch' mocha 'test/**/*.spec.js' --inline-diffs

unit-test-coverage:
	NODE_OPTIONS='--no-experimental-fetch' nyc mocha 'test/**/*.spec.js' --inline-diffs

test:
	make verify
	make unit-test

demo-build:
	@rm -rf node_modules/n-feedback
	@mkdir node_modules/n-feedback
	@cp main.scss node_modules/n-feedback/main.scss
	@cp index.js node_modules/n-feedback/index.js
	@cp -r src/ node_modules/n-feedback/src/
	@cp -r templates/ node_modules/n-feedback/templates/
	@NODE_OPTIONS="--openssl-legacy-provider" webpack --mode development
	@$(DONE)

demo: demo-build
	@nodemon demos/app.js

a11y: demo-build
	@node .pa11yci.js
	@PA11Y=true node demos/app
	@$(DONE)
