'use strict';

const StripeServer = require('../lib/stripeServer');
const stripeServer = new StripeServer();

const stripeSecretKey = 'sk_test_this_is_a_test_key';

if (process.env.STRIPE_SECRET_KEY) {
  global.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  global.stripe = require('stripe')(stripeSecretKey);

  stripe._api.protocol = 'http';
  stripe._api.host = 'localhost';
  stripe._api.port = '5757';

  before(function(done) {
    stripeServer.boot(done);
  });

  after(function() {
    stripeServer.quit();
  });
}

global.stripe.util = stripeServer.util;
global.stripe.data = stripeServer.data;
