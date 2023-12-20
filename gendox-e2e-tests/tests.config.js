require('dotenv').config();



let testsConfig = require('./config/local.config')

if (process.env.CONFIG_DIR) {
    testsConfig = require(process.env.CONFIG_DIR)
} else if (process.env.ENV_NAME == 'DEV') {
    testsConfig = require('./config/dev.config')
} else if (process.env.ENV_NAME == 'QA') {
    testsConfig = require('./config/qa.config')
}

module.exports = testsConfig;
