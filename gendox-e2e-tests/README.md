# Gendox End-2-End Tests

This directory contains the end-2-end tests for Gendox. These tests are written in Playwright JS. 
The tests **must** run before each PR to `dev` or `main` branches.




## Run the tests

The default configuration file is `local.config.json`. 
To run the tests, you need to setup the database, the backend and the IdP first. Soon an docekr-compose file will be provided to do this. 

Then you can run the tests with the following command:
```bash
npx playwright test
```

To start the Playwright UI to run the tests:
```bash
npx playwright test --ui
```

## Run the tests the DEV environment

Create a `.env` file with the ./gendox-e2e-tests directory with the environement variables that are required by `dev.config.json` file, like this:

```bash
ENV_NAME=DEV
SIMPLE_USER_USERNAME=****@test.com
SIMPLE_USER_PASSWORD=****
ADMIN_USER_USERNAME=****@test.com
ADMIN_USER_PASSWORD=****
```

## Page Object Model

The tests will be written using the Page Object Model pattern. For the time being, the tests are written in the `tests` directory and the page objects are in the `page-objects` directory.
In there is also a directory `./page-objects/apis` that contains the equivalent of "page objects" for the API testing.