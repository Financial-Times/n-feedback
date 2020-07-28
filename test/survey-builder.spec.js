const { expect } = require('chai');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const surveyBuilder = require('./../src/survey-builder');

function getFixtureDOM (jsonFileName){
	const fixtureFile = require(`./fixtures/${jsonFileName}`);
	const html = surveyBuilder.buildSurvey(fixtureFile);
	const { document } = (new JSDOM(html)).window;

	return document;
}

describe('surveyBuilder()', () => {
	describe('for a well-formed survey JSON', () => {
		const document = getFixtureDOM('working-survey.json');

		it('should return the right HTML', () => {
			// Checking to see if the basics of a survey HTML are there
			expect(document.querySelector('.n-feedback__survey')).to.exist;
			expect(document.querySelector('.n-feedback__survey__wrapper-form')).to.exist;

			// Should have the close button
			expect(document.querySelector('.n-feedback__survey__close-button')).to.exist;
		});

		// TODO: Should be testing for the button bar functionality
		// - no next button on last screen
		// - no back button on first screen
		// - submit button on last screen only
		it('should have next/back buttons', () => {
			expect(document.querySelector('.n-feedback__survey-next')).to.exist;
		});

		it('should have a submit button', () => {
			expect(document.querySelector('.n-feedback__survey-submit')).to.exist;
		});
	});

	describe('text area', () => {
		const document = getFixtureDOM('only-textarea.json');

		it('should be rendered', () => {
			expect(document.querySelector('.n-feedback__survey-block div.n-feedback__question-text-entry.o-forms .o-forms-field label.o-forms-label span.o-forms-title span.o-forms-title__main')).to.exist;
			expect(document.querySelector('.n-feedback__survey-block div.n-feedback__question-text-entry.o-forms .o-forms-field label.o-forms-label div.o-forms-input.o-forms-input--textarea textarea')).to.exist;
		});
	});

	describe('text block', () => {
		const document = getFixtureDOM('only-text.json');

		it('should be rendered', () => {
			expect(document.querySelector('.n-feedback__survey-block p.n-feedback__question-text')).to.exist;
			expect(document.querySelector('.n-feedback__survey-block p.n-feedback__question-text').textContent).to.have.string('Sample text');
		});
	});

	// TODO: Creating these stubs for when we pick up later.
	// They should have a similar structure, but we should consider exposing
	// individual generator functions for easier/more precise testing
	describe.skip('Survey header block', () => {});
	describe.skip('Survey footer block', () => {});
	describe.skip('Survey buildQuestion block', () => {}); // Question type parsing
	describe.skip('Survey multiple choice question block', () => {});
	describe.skip('Survey text entry question block', () => {});
});
