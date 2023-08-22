require('isomorphic-fetch');
const nock = require('nock');
const { expect } = require('chai');
const postResponse = require('./../src/post-response');
const surveyData = require('./fixtures/survey-data.json');

describe('postResponse()', () => {
	const feedbackApi = 'https://www.ft.com/__feedback-api/v1';
	const surveyId = '1234567890';
	const responses = {
		'QID6': '4',
		'QID4': 'It was lovely!'
	};
	const additionalData = {
		appName: 'homepage'
	};

	afterEach(() => {
		nock.cleanAll();
	});

	it('should send the response to the Feedback API', async () => {
		const postNock = nock(feedbackApi)
			.post('/survey')
			.reply(200);

		await postResponse(surveyId, surveyData, responses, additionalData);
		expect(postNock.isDone()).to.be.true;
	});

	it('should include responses to each question', async () => {
		const postNock = nock(feedbackApi)
			.post('/survey', body => body.surveyResponse && body.surveyResponse.length === 2)
			.reply(200);

		await postResponse(surveyId, surveyData, responses, additionalData);
		expect(postNock.isDone()).to.be.true;
	});

	it('should include the survey ID', async () => {
		const postNock = nock(feedbackApi)
			.post('/survey', body => body.surveyId === surveyId)
			.reply(200);

		await postResponse(surveyId, surveyData, responses, additionalData);
		expect(postNock.isDone()).to.be.true;
	});

	it('should include any additional data', async () => {
		const postNock = nock(feedbackApi)
			.post('/survey', body => body.additionalData && body.additionalData.appName === 'homepage')
			.reply(200);

		await postResponse(surveyId, surveyData, responses, additionalData);
		expect(postNock.isDone()).to.be.true;
	});

	describe('each question in the survey response', () => {
		it('should include the question ID', async () => {
			const firstQuestionId = 'QID6';
			const postNock = nock(feedbackApi)
				.post('/survey', body => body.surveyResponse[0] && body.surveyResponse[0].id === firstQuestionId)
				.reply(200);

			await postResponse(surveyId, surveyData, responses, additionalData);
			expect(postNock.isDone()).to.be.true;
		});

		it('should include the question text', async () => {
			const firstQuestionText = 'How easy was your visit to FT.com today?';
			const postNock = nock(feedbackApi)
				.post('/survey', body => body.surveyResponse[0] && body.surveyResponse[0].text === firstQuestionText)
				.reply(200);

			await postResponse(surveyId, surveyData, responses, additionalData);
			expect(postNock.isDone()).to.be.true;
		});

		it('should include the response to the question', async () => {
			const firstQuestionResponse = '4';
			const postNock = nock(feedbackApi)
				.post('/survey', body => body.surveyResponse[0] && body.surveyResponse[0].response === firstQuestionResponse)
				.reply(200);

			await postResponse(surveyId, surveyData, responses, additionalData);
			expect(postNock.isDone()).to.be.true;
		});
	});
});
