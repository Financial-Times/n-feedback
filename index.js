// o-overlay export is different depending on if n-feedback is being imported using bower or npm
let Overlay = require('@financial-times/o-overlay');
Overlay = Overlay.default || Overlay;

const surveyBuilder = require('./src/survey-builder');
const postResponse = require('./src/post-response');
const getAdditionalInfo = require('./src/get-additional-info');
const dictionary = require('./src/dictionary');


function getSurveyData(surveyId) {
	// const surveyDataURL = 'http://localhost:5005/public/survey.json'; // for local development
	// const surveyDataURL = `http://localhost:3002/v1/survey/${surveyId}`; // for local development via npm linking
	const surveyDataURL = `https://www.ft.com/__feedback-api/v1/survey/${surveyId}`; // production link
	return fetch(surveyDataURL, {
		headers: {
			'Accept': 'application/json',
		}
	}).then(res => {
		if (res.status !== 200) {
			res.text().then(txt => {
				throw new Error(`Bad response status ${status}: ${txt}`);
			});
		}
		return res.json();
	});
}

function setBehaviour(overlay, surveyData, surveyId, appInfo) {
	const context = overlay.content;
	const {containerSelector = 'body'} = appInfo;

	// Adding behaviour for Next and Back buttons, moving between blocks/pages
	const navButtons = document.querySelectorAll('.n-feedback__survey-next,.n-feedback__survey-back', context);
	navButtons.forEach(button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			const current = event.target;
			const nextBlockSelector = '.' + current.getAttribute('data-survey-next');

			displayBlock(overlay, nextBlockSelector);
		}, true);
	});

	// onSubmit event for the form
	const surveyForm = document.querySelector('.n-feedback__survey__wrapper-form', context);
	if (surveyForm) {
		surveyForm.addEventListener('submit', event => {
			event.preventDefault();

			const surveyResponse = generateResponse(overlay);
			const additionalData = getAdditionalInfo(appInfo);

			displayBlock(overlay, '.feedback-overlay__loader-wrapper');
			postResponse(surveyId, surveyData, surveyResponse, additionalData)
				.then(() => {
					displayBlock(overlay, '.n-feedback__survey-block-finished');
					overlay.wrapper.addEventListener('oOverlay.destroy', () => {
						hideFeedbackButton(containerSelector);
					});
				})
				.catch((err) => {
					// TODO: Manage fallback solution with local store and retry.
					// https://github.com/Financial-Times/next-feedback-api/issues/46
					console.error('Failed to post form', err); // eslint-disable-line no-console
					overlay.close();
				});
		});
	}

	// Set up validation
	if (context) {
		context.addEventListener('change', event => {
			const block = event.target.closest('.n-feedback__survey-block');
			runValidation(block);
		});
	}
}

function displayBlock(overlay, blockClass) {
	const context = overlay.content;
	const nextBlock = document.querySelector(blockClass, context);
	const allBlocks = document.querySelectorAll('.n-feedback__survey-block', context);

	runValidation(nextBlock);

	allBlocks.forEach(block => block.classList.add('n-feedback--hidden'));
	nextBlock.classList.remove('n-feedback--hidden');
}

function runValidation(block) {
	const nextButton = document.querySelector('.n-feedback__survey-next', block);

	if (validate(block)) {
		nextButton.removeAttribute('disabled');
		return true;
	} else {
		nextButton.setAttribute('disabled', 'disabled');
		return false;
	}
}

function validate(block) {
	const elements = document.querySelectorAll('[data-validation="true"]', block);

	// Valid form elements return false, only non-valid form elements are returned
	const invalides = Array.prototype.slice.call(elements).filter(el => {
		// TODO: Implement other questions types
		// For now we have only the radio button that needs validation
		if (el.classList.contains('n-feedback__question-radio')) {
			const radios = document.querySelectorAll('input[type="radio"]', el);
			const results = Array.prototype.slice.call(radios).filter(r => r.checked);
			// returns false if one of the radio buttons are selected
			return results.length === 0;
		}
	});

	return invalides.length === 0;
}

function generateResponse(overlay) {
	const context = overlay.content;
	const form = document.querySelector('.n-feedback__survey__wrapper-form', context);
	const data = {};

	form.querySelectorAll('input,textarea').forEach((element) => {
		if (element.type === 'radio') {
			if (element.checked) {
				data[element.name] = element.value;
			}
		} else if (element.type === 'checkbox') {
			if (element.checked) {
				data[element.name] = (data[element.name] || []).concat(element.value);
			}
		} else {
			data[element.name] = element.value;
		}
	});

	return data;
}

function toggleOverlay(overlay) {
	overlay[overlay.visible ? 'close' : 'open']();
}

function hideFeedbackButton(containerSelector) {
	document.querySelector(`${containerSelector} .n-feedback__container`).classList.add('n-feedback--hidden');
}

function populateContainer(container, domain) {
	const text = dictionary[domain].formHead;
	container.innerHTML =
		`<div class="n-feedback__overlay__container"></div>
		<p class="n-feedback__desktop__prompt">
			${text}
		</p>
		<button class="n-feedback__survey-trigger" aria-label="Give feedback on the Financial Times website" data-trackable="feedback-start">
			<span>Feedback</span>
		</button>`;
}

const setAppInfoDefault = (appInfo) => {
	if (!appInfo.domain) appInfo.domain = 'FT.com';
	if (!appInfo.containerSelector) appInfo.containerSelector = 'body';

	return appInfo;
};

module.exports.init = (appInfo = {}) => {
	const surveyId = 'SV_9mBFdO5zpERO0cZ';
	const {
		containerSelector,
		domain
	} = setAppInfoDefault(appInfo);
	let surveyData;
	let feedbackOverlay;

	const container = document.querySelector(`${containerSelector} .n-feedback__container`);
	if (!container) {
		// eslint-disable-next-line no-console
		console.error('The container was not found on the page.')
		throw new Error('The container was not found on the page.');
	}
	container.classList.remove('n-feedback--hidden');
	populateContainer(container, domain);
	const trigger = document.querySelector(`${containerSelector} .n-feedback__container .n-feedback__survey-trigger`);

	const overlayId = `feedback-overlay-${containerSelector}`;

	if (trigger) {
		trigger.addEventListener('click', () => {
			if (!feedbackOverlay) {
				feedbackOverlay = new Overlay(overlayId, {
					html: '<div class="feedback-overlay__loader-wrapper"><div class="o-loading o-loading--dark o-loading--large"></div></div>',
					fullscreen: true,
					class: 'feedback-overlay',
					zindex: 1001,
					customclose: '.n-feedback__survey__close-button'
				});
			}
			if (!surveyData) {
				getSurveyData(surveyId).then(data => {
					if (!data || (data && data.length === 0)) {
						// eslint-disable-next-line no-console
						console.error('Bad survey data');
					} else {
						surveyData = data;
						const html = surveyBuilder.buildSurvey(surveyData, surveyId, domain);
						// TODO: Validate the html
						if (!feedbackOverlay.visible) {
							feedbackOverlay.open();
						}

						feedbackOverlay.content.innerHTML = html;
						setBehaviour(feedbackOverlay, surveyData, surveyId, appInfo);

						// run Validation as soon as you display the first block
						const firstBlock = document.querySelectorAll('.n-feedback__survey-block', feedbackOverlay.content)[0];
						runValidation(firstBlock);
					}
				}).catch((err) => {
					// In case survey fetch fails
					feedbackOverlay.destroy();
					container.classList.add('n-feedback--hidden');
					trigger.classList.add('n-feedback--hidden');
					// eslint-disable-next-line no-console
					console.error('Failed to get survey data', err);
				});
			}

			toggleOverlay(feedbackOverlay);
		}, true);
	}

	return {
		destroy: () => {
			if (feedbackOverlay) feedbackOverlay.destroy();
		}
	};
};
