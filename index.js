const fetch = require('node-fetch')
const Promise = require('bluebird')

const config = require('./config')

const LIFX_API = 'https://api.lifx.com/'

const DURATION_IN_SECONDS = 0.5
const DELAY_BETWEEN_API_CALLS = DURATION_IN_SECONDS * 1000

const HUE_DELTA = 10
const COLOR_CYCLES = 360 / HUE_DELTA

const headers = {
	Authorization: `Bearer ${config.apiToken}`,
	'Content-Type': 'application/json',
}

const initialSettings = {
	brightness: 1,
	color: 'hue:0',
	duration: 0,
	power: 'on',
	saturation: 1,
}

const changeHueByDelta = () => (
	fetch(
		`${LIFX_API}v1/lights/group:Living Room/state/delta`,
		{
			body: (
				JSON.stringify({
					duration: DURATION_IN_SECONDS,
					hue: HUE_DELTA,
				})
			),
			headers,
			method: 'POST',
		}
	)
)

const setHueDelta = (cyclesRemaining = 0, promise = Promise.resolve()) => (
	cyclesRemaining === 0
	? promise
	: (
		setHueDelta(
			cyclesRemaining - 1,
			(
				promise
				.then(changeHueByDelta)
				.then(() => console.log(cyclesRemaining))
				.delay(DELAY_BETWEEN_API_CALLS)
			)
		)
	)
)

Promise.resolve(
	fetch(
		`${LIFX_API}v1/lights/group:Living Room/state`,
		{
			body: JSON.stringify(initialSettings),
			headers,
			method: 'PUT',
		}
	)
)
.delay(50)
.then(() => setHueDelta(COLOR_CYCLES))
.catch(err => console.error(err))
