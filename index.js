const Overlay = require('o-overlay');
const surveyBuilder = require('./survey-builder');

async function getSurveyData (){
	const surveyDataURL = 'http://local.ft.com:5005/public/survey.json';
	return fetch(surveyDataURL).then( res => {
		return res.json();
	}).catch( err => {
		console.error('getSurveyData: XHR: ', err);
	});
}

function setBehaviour (overlay){
	const context = overlay.content;

	const nextButtons = document.querySelectorAll('.feedback__survey-next', context);
	nextButtons.forEach( button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			const current = event.target;
			const block = current.closest('.feedback__survey-block');
			const nextBlockSelector = '.' + current.getAttribute('data-survey-next');
			const nextBlock = document.querySelector(nextBlockSelector);

			if( !nextBlock ){
				console.error(`Next button: next block '${nextBlockSelector}' not found`);
				return false;
			}

			block.classList.add('hidden');
			nextBlock.classList.remove('hidden');
		}, true);
	});

	const submitButtons = document.querySelectorAll('.feedback__survey-submit', context);
	submitButtons.forEach( button => {
		button.addEventListener('click', event => {
			event.preventDefault();

			const current = event.target;

			const request = new XMLHttpRequest();
			request.open("POST", "/formlol");
			request.send(generateResponse(overlay));
			overlay.close();
		});
	});
}

function generateResponse(overlay){
	const context = overlay.content;
	const form = document.querySelector('.feedback__survey__wrapper-form', context);
	const response = {};
	(new FormData(form)).forEach((val, key) => {
		response[key] = val;
	});

	return JSON.stringify(response);
}

function toggleOverlay (overlay){
	overlay[ overlay.visible ? 'close' : 'open' ]();
}

module.exports.init = () => {
	getSurveyData().then( surveyData => {
		const html = surveyBuilder.buildSurvey(surveyData);
		const trigger = document.querySelector('.feedback__container .feedback__survey-trigger');
		const isMobile = !!window.getComputedStyle(document.querySelector('.feedback__desktop__promt'))
																.getPropertyValue('display') !== 'none';

		const feedbackOverlay = new Overlay('feedback-overlay', {
			html: html,
			nested: !isMobile,
			preventclosing: false,
			parentnode: isMobile ? 'body' : '.feedback__overlay__container',
			fullscreen: isMobile
		});

		trigger.addEventListener('click', () => {
			toggleOverlay(feedbackOverlay);
		}, true);

		document.addEventListener('oOverlay.ready', () => {
			setBehaviour(feedbackOverlay);
		 }, true);
	});
};
