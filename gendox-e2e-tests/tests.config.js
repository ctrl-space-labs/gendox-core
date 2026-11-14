require('dotenv').config();
const target = require('./config/target');

// The default is this checkout's ephemeral environment. E2E_TARGET=dev|prod selects a
// deployed one (config/target.js). The older configurations stay selectable by name.
let testsConfig;

if (process.env.CONFIG_DIR) {
    testsConfig = require(process.env.CONFIG_DIR)
} else if (target.deployed) {
    testsConfig = require('./config/deployed.config')
} else if (process.env.ENV_NAME == 'E2E') {
    testsConfig = require('./config/e2e.config')
} else if (process.env.ENV_NAME == 'LOCAL') {
    testsConfig = require('./config/local.config')
} else {
    testsConfig = require('./config/ephemeral.config')
}

module.exports = testsConfig;
