
const dictionary = require('./dictionary');

function buildHeader (question) {
	return `<div class="n-feedback__center-block"><h2 class="n-feedback__question-header">${question.questionText}</h2></div>`;
}

function buildText (question) {
	return `<p class="n-feedback__question-text">${question.questionText}</p>`;
}

function buildFooter (question) {
	return `<div class="n-feedback__center-block"><p class="n-feedback__question-footer">${question.questionText}</p></div>`;
}

function buildQuestion (question) {
	const questionBuilderMap = {
		// MC - Multiple Choice
		'MC': buildMultipleChoiceQuestion,
		// TE - Text Entry
		'TE': buildTextEntryQuestion
	};

	const questionType = question.questionType.type;
	if ( questionType in questionBuilderMap ) {
		return questionBuilderMap[questionType](question);
	} else {
		// console.log('Feedback: buildQuestion - question type not defined: ', questionType, question);
	}

	return '';
}

function buildMultipleChoiceQuestion (question) {
	const validation = question.validation.doesForceResponse;

	const html = [
		`<div class="n-feedback__question-radio o-forms-field" role="group" aria-labelledby="n-feedback-form-question-title" data-validation=${validation}>
			<span class="o-forms-title" aria-hidden="true">
				<span class="o-forms-title__main" id="n-feedback-form-question-title">${question.questionText}</span>
			</span>
			<div class="n-feedback__question-radio__outer-container">
				<span class="n-feedback__question-radio__container n-feedback__center-block o-forms-input o-forms-input--radio-round o-forms-input--inline">`
	];

	const choices = Object.entries(question.choices).reverse();

	choices.forEach( ([choiceId, choice], current, choices) => {
		let textVisibility = '';
		// if not the first or the last element
		if ( !(choiceId === choices[0][0] || choiceId === choices[choices.length-1][0]) ) {
			textVisibility = 'hidden-label';
		}
		const fieldId = `choice-${choiceId}-${~~(Math.random()*0xffff)}`;

		html.push(
			`<label class="n-feedback__question-radio__choice-container">
				<input type="radio" id="${fieldId}" name="${question.questionId}" value="${choiceId}" aria-label="${choice.choiceText}">
				<span class="o-forms-input__label ${textVisibility}" aria-hidden="true">
					<span>${choice.choiceText}</span>
				</span>
			</label>`
		);
	});

	html.push(`
				</span>
			</div>
		</div>`
	);
	return html.join('\n');
}

function buildTextEntryQuestion (question) {
	const fieldId = `text-${question.questionId}-${~~(Math.random()*0xffff)}`;

	const html =
		`<div class="n-feedback__center-block"><p class="n-feedback__question-text-entry o-forms">
			<label for="${fieldId}" class="o-forms__label">${question.questionText}</label>
			<textarea id="${fieldId}" name="${question.questionId}" class="o-forms__textarea"></textarea>
		</p></div>`;

	return html;
}

function buildButtonBar (surveyLength, blockId){
	const blockHTML = [];
	blockHTML.push('<div class="n-feedback__center-block"><p class="n-feedback__survey__button-bar">');

	if( blockId > 0 ) {
		blockHTML.push(
			`<button class="n-feedback__primary-button n-feedback__survey-back"
				data-survey-next="n-feedback__survey-block-${blockId-1}"
				data-trackable="feedback-previous-block">
				Back
			</button>`
		);
	}

	// if this not the last block on the survey
	if ( surveyLength - 1 > blockId ) {
		blockHTML.push(
			`<button class="n-feedback__primary-button n-feedback__survey-next"
				data-survey-next="n-feedback__survey-block-${blockId+1}"
				data-trackable="feedback-next-block">
				Next
			</button>`
		);
	} else {
		blockHTML.push(
			`<button class="n-feedback__primary-button n-feedback__survey-submit"
				data-trackable="feedback-submit">
				Submit
			</button>`
		);
	}

	blockHTML.push('</p></div>');

	return blockHTML.join('\n');
}

function buildSurvey (surveyData, surveyId, domain) {
	const builderMap = {
		header: buildHeader,
		footer: buildFooter,
		text: buildText,
		question: buildQuestion
	};

	const surveyHTML = [
		`<div class="n-feedback__survey" aria-live="assertive">
			<a class="n-feedback__survey__close-button o-overlay__close" href="#void">
				<span>I don't want to give feedback</span>
			</a>
			<form class="n-feedback__survey__wrapper-form">
				<input type="hidden" name="surveyId" value="${surveyId}" />`
	];

	surveyData.forEach( (block, blockId) => {
		// Only show the first block initially, hide the others
		const hiddenClass = (blockId === 0 ? '': 'n-feedback--hidden');
		const blockHTML = [`<div class="n-feedback__survey-block ${hiddenClass} n-feedback__survey-block-${blockId}">`];

		block.questions.forEach( question => {
			if (question.questionText.trim() === 'How easy or hard was it to use FT.com today?' && domain === 'app') {
				question.questionText = dictionary[domain].formHead;
			}

			const blockType = question.questionName.toLowerCase();
			if( blockType in builderMap ){
				const questionHTML = builderMap[blockType]( question );
				blockHTML.push(questionHTML);
			}else{
				// console.log('Feedback: Qualtrics survey question type not defined: ', blockType, question);
			}
		});

		blockHTML.push(buildButtonBar( surveyData.length, blockId ));
		blockHTML.push('</div>');
		surveyHTML.push(blockHTML.join('\n'));
	});

	surveyHTML.push('</form>');

	surveyHTML.push('<div class="n-feedback__survey-block feedback-overlay__loader-wrapper n-feedback--hidden"><div class="o-loading o-loading--dark o-loading--large"></div></div>');

	// grab the first text block. this is a nice blurb to use for a message
	const feedbackQuestion = surveyData.map(block => block.questions.find(
		question => question.questionName === 'Text'
	))[0];

	surveyHTML.push(
		`<div class="n-feedback__survey-block n-feedback--hidden n-feedback__survey-block-finished">
			${buildHeader({questionText: 'Thanks for your feedback'})}

			${feedbackQuestion ? buildFooter(feedbackQuestion) : ''}

			<div class="n-feedback__center-block"><p class="n-feedback__survey__button-bar">
				<button class="n-feedback__primary-button o-overlay__close">
					Close
				</button>
		</div>`
	);

	surveyHTML.push('</div>');
	return surveyHTML.join('\n');
}

module.exports = {
	buildSurvey
};
