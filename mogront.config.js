'use strict';

import Env from '~/env';
import Path from 'path';
import Respondent from 'respondent';

const config = new Respondent({ rootDir: Path.join(__dirname, 'src', 'config'), env: Env });

export default (config.get('database'));
