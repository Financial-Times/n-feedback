node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

unit-test:
	mocha 'test/**/*.spec.js' --inline-diffs

test:
	make verify
	make unit-test

demo-build:
	@rm -rf bower_components/n-feedback
	@mkdir bower_components/n-feedback
	@cp main.scss bower_components/n-feedback/main.scss
	@cp index.js bower_components/n-feedback/index.js
	@cp -r src/ bower_components/n-feedback/src/
	@cp -r templates/ bower_components/n-feedback/templates/
	@webpack --mode development
	@node-sass demos/src/demo.scss public/main.css --include-path bower_components
	@$(DONE)

demo: demo-build
	@nodemon demos/app.js

a11y: demo-build
	@node .pa11yci.js
	@PA11Y=true node demos/app
	@$(DONE)
