// Global Dir Hack
global.baseDir = `${__dirname}/`

// Load Config settings
const dir = require(`${global.baseDir}global-dirs`)
const setupServer = require(`${dir.server}setup-server`)
const startServer = require(`${dir.server}start-server`)

// Load Middleware
const cycleColors = require(`${dir.middleware}cycle-colors`)

const serverSettings = setupServer()

serverSettings.get(
	'/',
	(req, res) => res.sendFile(`${dir.base}index.html`)
)

serverSettings.put(
	'/api/cycle-colors/:selector',
	({ body, params }, res ) => (
		console.log(body, params) ||
		res.send(
			cycleColors(
				Object.assign(
					{},
					body,
					params
				)
			)
		)
	)
)

startServer(serverSettings)
