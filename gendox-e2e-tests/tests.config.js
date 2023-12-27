require('dotenv').config();



let testsConfig = require('./config/local.config')

if (process.env.CONFIG_DIR) {
    testsConfig = require(process.env.CONFIG_DIR)
} else if (process.env.ENV_NAME == 'DEV') {
    testsConfig = require('./config/dev.config')
} else if (process.env.ENV_NAME == 'E2E') {
    testsConfig = require('./config/e2e.config')
}

console.log('Running in environment: ', process.env.ENV_NAME);
console.log('With external config: ', true === process.env.CONFIG_DIR);

module.exports = testsConfig;
