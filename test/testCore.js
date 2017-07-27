'use strict';

const StripeServer = require('../lib/stripeServer');
const stripeServer = new StripeServer();

global.stripe = require('stripe')('sk_this-is-a-test-key');
stripe._api.protocol = 'http';
stripe._api.host = 'localhost';
stripe._api.port = '5757';

before(function(done) {
  stripeServer.boot(done);
});

after(function() {
  stripeServer.quit();
});
