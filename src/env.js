'use strict';

import Path from 'path';
import DotEnv from 'dotenv';
import DotEnvParseVariables from 'dotenv-parse-variables';
import Respondent from 'respondent';

/**
 * Will log an error to the console and exit the process.
 *
 * @param {Error} err
 */
function logEnvErrorAndExit(err) {
  console.error('Unable to load the necessary variables from the .env file');
  if (error) {
    console.error(err);
  }
  process.exit(1);
};

/**
 * Retrieve .env variables
 */
let env = DotEnv.config({
  silent: true,
  path: Path.join(__dirname, '..', '.env')
});

if (env.error) {
  logEnvErrorAndExit(env.error);
} else {
  env.parsed = DotEnvParseVariables(env.parsed);
}

if (!env.parsed) {
  logEnvErrorAndExit();
}

export default env.parsed;
