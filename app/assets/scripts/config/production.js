'use strict';
var logo = require('./logo');
/*
 * App config for production.
 */
module.exports = {
  environment: 'production',
  consoleMessage: logo,
  mapbox: {
    token: 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q',
    baseStyle: 'mapbox://styles/devseed/ciqs29d060000clnr9222bg5x',
  },
  api: 'https://api.openaq.org/v2',
  metadata: 'https://metadata.openaq.org',
  apiDocs: 'https://docs.openaq.org',
  feedbackUrl: 'https://forms.gle/rqsAPDSebNTG8PsJ8',
  newSourceUrl:
    'https://docs.google.com/forms/d/1Osi0hQN1-2aq8VGrAR337eYvwLCO5VhCa3nC_IK2_No/viewform',
};
