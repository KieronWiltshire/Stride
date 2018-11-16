'use strict';

import Express from 'express';
import FXCMAPI from '~/api/fxcm';

const router = Express.Router();

// FXCMAPI.getHistoricalData({ symbol: 'EUR/USD', timeframe: 'm5' }).then(console.log).catch(console.err);

export default router;
