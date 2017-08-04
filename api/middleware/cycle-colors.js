const fetch = require('node-fetch')
const Promise = require('bluebird')

const dir = require(`${global.baseDir}global-dirs`)
const logger = require(`${dir.utils}logger`)

const LIFX_API = 'https://api.lifx.com/'

const changeHueByDelta = ({
	duration,
	headers,
	hueDelta,
	selector,
}) => () => (
	fetch(
		`${LIFX_API}v1/lights/${selector}/state/delta`,
		{
			body: (
				JSON.stringify({
					duration,
					hue: hueDelta,
				})
			),
			headers,
			method: 'POST',
		}
	)
)

const getHeaders = apiToken => (
	{
		Authorization: `Bearer ${apiToken}`,
		'Content-Type': 'application/json',
	}
)

const getNextHueValue = cyclesRemaining => cyclesRemaining - 1

const setInitialState = ({
	headers,
	initialSettings,
	selector,
}) => () => (
	fetch(
		`${LIFX_API}v1/lights/${selector}/state`,
		{
			body: JSON.stringify(initialSettings),
			headers,
			method: 'PUT',
		}
	)
)

module.exports = ({
	apiToken = '',
	brightness = 1,
	cycles = 1,
	duration = 0.5,
	hueDelta = 10,
	saturation = 1,
	selector = '',
}) => {
	logger.log(`Command: Cycle Colors => ${selector} for ${duration}`)

	const durationInMilliseconds = duration * 1000
	const encodedSelector = encodeURIComponent(selector)
	const headers = getHeaders(apiToken)
	const numberOfTransitions = 360 / hueDelta

	const initialSettings = {
		brightness,
		color: `saturation:${saturation}`,
		duration: 0,
		power: 'on',
	}

	const changeHue = (
		changeHueByDelta({
			duration,
			headers,
			hueDelta,
			selector: encodedSelector,
		})
	)

	const getNextHueAction = (promise, cyclesRemaining) => (
		promise
		.then(changeHue)
		.then(() => logger.log(cyclesRemaining))
		.delay(durationInMilliseconds)
	)

	const setHueDelta = (cyclesRemaining, promise = Promise.resolve()) => () => (
		cyclesRemaining === 0
		? promise
		: (
			setHueDelta(
				getNextHueValue(cyclesRemaining),
				getNextHueAction(promise, cyclesRemaining)
			)()
		)
	)

	const resetToInitialState = (
		setInitialState({
			headers,
			initialSettings,
			selector: encodedSelector,
		})
	)

	Promise.resolve()
	.then(resetToInitialState)
	.delay(50)
	.then(setHueDelta(numberOfTransitions * cycles))
	.catch(logger.logError)
}
