const Overlay = require('o-overlay');

async function getSurveyData (){
	const surveyDataURL = 'http://local.ft.com:5005/public/survey.json';
	return fetch(surveyDataURL).then( res => {
		return res.json();
	}).catch( err => {
		console.error('getSurveyData: XHR: ', err);
	});
}

function buildHeader (question){
	return `<h3 class="feedback__question-header">${question.questionText}</h3>`;
}

function buildText (question){
	return `<p class="feedback__question-text">${question.questionText}</p>`;
}

function buildFooter (question){
	return `<p class="feedback__question-footer">${question.questionText}</p>`;
}

function buildQuestion (question){
	const questionBuilderMap = {
		// MC - Multiple Choice
		'MC': buildMultipleChoiceQuestion,
		// TE - Text Entry
		'TE': buildTextEntryQuestion
	};

	const questionType = question.questionType.type;
	if( questionType in questionBuilderMap ){
		return questionBuilderMap[questionType](question);
	}else{
		console.log('Feedback: buildQuestion - question type not defined: ', questionType, question);
	}

	return '';
}

function buildMultipleChoiceQuestion (question){
	const html = [`<fieldset class="feedback__question-radio o-forms">
									<legend>${question.questionText}</legend>
									<div class="feedback__question-radio__container o-forms__group">`]; // fieldsets can't display: flex

	Object.entries(question.choices).forEach( ([choiceId, choice], current, choices) => {
		let textVisibility = '';
		// if not the first or the last element
		if( !(choiceId === choices[0][0] || choiceId === choices[choices.length-1][0]) ){
			textVisibility = 'hidden-label';
		}
		const fieldId = `choice-${choiceId}-${~~(Math.random()*0xffff)}`;

		html.push(`<div class="feedback__question-radio__choice-container">
								<input type="radio" id="${fieldId}" class="o-forms__radio" name="${question.questionId}" value="${choiceId}" />
								<label for="${fieldId}" class="o-forms__label ${textVisibility}">
									<span class="feedback__question-radio-text">${choice.choiceText}</span>
								</label>
							</div>`);
	});

	html.push(`</div>
						</fieldset>`);
	return html.join('\n');
}

function buildTextEntryQuestion (question){
	const fieldId = `text-${question.questionId}-${~~(Math.random()*0xffff)}`;

	const html = `<p class="feedback__question-text-entry o-forms">
									<label for="${fieldId}" class="o-forms__label">${question.questionText}</label>
									<textarea id="${fieldId}" name="${question.questionId}" class="o-forms__textarea"></textarea>
								</p>`;

	return html;
}

function buildSurveyHTML (surveyData){
	const builderMap = {
		header: buildHeader,
		footer: buildFooter,
		text: buildText,
		question: buildQuestion
	};

	const surveyHTML = ['<div class="feedback__survey">'];

	surveyData.forEach( (block, blockId) => {
		// Only show the first block initially, hide the others
		const hiddenClass = (blockId === 0 ? '': 'hidden');
		const blockHTML = [`<div class="feedback__survey-block ${hiddenClass} feedback__survey-block-${blockId}">`];

		block.questions.forEach( question => {
			const blockType = question.questionName.toLowerCase();
			if( blockType in builderMap ){
				const questionHTML = builderMap[blockType]( question );
				blockHTML.push(questionHTML);
			}else{
				console.log('Feedback: Qualtrics survey question type not defined: ', blockType, question);
			}
		});

		// if this not the last block on the survey
		if( surveyData.length - 1 > blockId ){
			blockHTML.push(`<p class="feedback__survey__button-bar">
												<button class="o-buttons o-buttons--primary feedback__survey-next"
																data-survey-next="feedback__survey-block-${blockId+1}">
													Next
												</button>
											</p>`
			);
		}else{
			blockHTML.push(`<p class="feedback__survey__button-bar">
												<button class="o-buttons o-buttons--primary feedback__survey-submit">
													Submit
												</button>
											</p>`
			);
		}

		blockHTML.push('</div>');
		surveyHTML.push(blockHTML.join('\n'));
	});

	surveyHTML.push('</div>');
	return surveyHTML.join('\n');
}


function setBehaviour (overlay){
	const context = overlay.content;

	const nextButtons = document.querySelectorAll('.feedback__survey-next', context);
	nextButtons.forEach( button => {
		button.addEventListener('click', event => {
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
			const current = event.target;
			overlay.close();
		});
	});
}

function toggleOverlay (overlay){
	overlay[ overlay.visible ? 'close' : 'open' ]();
}

module.exports.init = () => {
	getSurveyData().then( surveyData => {
		const html = buildSurveyHTML(surveyData);
		const trigger = document.querySelector('.feedback__trigger');

		const feedbackOverlay = new Overlay('feedback-overlay', {
			html: html,
			nested: true,
			parentnode: '.feedback__overlay__container'
		});

		trigger.addEventListener('click', () => {
			toggleOverlay(feedbackOverlay);
		}, true);

		document.addEventListener('oOverlay.ready', () => {
			setBehaviour(feedbackOverlay);
		 }, true);
	});
};
