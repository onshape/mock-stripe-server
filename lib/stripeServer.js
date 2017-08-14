'use strict';

const restify = require('restify');

function StripeServer(config) {
  const stripe = this;

  stripe.apiVersion = '2017-06-05';

  stripe.version = require('../package.json').version;
  stripe.host = '127.0.0.1';
  stripe.port = 5757; // 787473, 32928
  stripe.livemode = false;
  stripe.options = {
    silent: false
  };

  stripe.util = require('./util');
  stripe.data = require('../data');

  stripe.store = require('./dataStore')(stripe);

  stripe.server = restify.createServer({
    name: 'StripeServer'
  });

  stripe.server.use(restify.pre.sanitizePath());
  stripe.server.use(restify.plugins.dateParser());
  stripe.server.use(restify.plugins.queryParser());
  stripe.server.use(restify.plugins.bodyParser());
  stripe.server.use(restify.plugins.authorizationParser());

  stripe.server.use(function (req, res, next) {
    const requestId = 'req_' + stripe.util.generateUniqueId(24);
    req.requestId = requestId;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT');
    res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');

    res.header('Request-Id', requestId);
    res.header('mock-stripe-server-version', stripe.version);
    res.header('Stripe-Version', stripe.apiVersion);

    if (!stripe.options.silent) {
      stripe.util.logger(req);
    }
    next();
  });

  ////////////////////

  stripe.placeHolder = function(req, res, next) {
    console.log('%s: %s %s', stripe.util.colorize('cyan', 'UNIMPLEMENTED ENDPOINT'),
      req.method, req.url);

    res.send(200, {
      message: 'placeholder'
    });
    next();
  };

  stripe.server.opts(/.*/, function(req, res, next) {
    res.send(200);
    next();
  });

  ////////////////////

  stripe.model = require('./model')(stripe);
  stripe.errors = require('./errors')(stripe);
  stripe.auth = require('./auth')(stripe);
  stripe.tokens = require('./tokens')(stripe);
  stripe.plans = require('./plans')(stripe);
  stripe.coupons = require('./coupons')(stripe);
  stripe.customers = require('./customers')(stripe);
  stripe.discounts = require('./discounts')(stripe);
  stripe.cards = require('./cards')(stripe);
  stripe.subscriptions = require('./subscriptions')(stripe);
  stripe.invoices = require('./invoices')(stripe);
  stripe.invoiceItems = require('./invoiceItems')(stripe);
  stripe.charges = require('./charges')(stripe);
  stripe.events = require('./events')(stripe);
  stripe.webhooks = require('./webhooks')(stripe);

  ////////////////////

  if (config) {
    stripe.util.parseConfig(stripe, config);
  }

  ////////////////////

  stripe.server.get(/.*/, stripe.placeHolder);
  stripe.server.post(/.*/, stripe.placeHolder);
  stripe.server.put(/.*/, stripe.placeHolder);
  stripe.server.head(/.*/, stripe.placeHolder);
  stripe.server.del(/.*/, stripe.placeHolder);

  ////////////////////

  stripe.boot = function(callback) {
    stripe.server.listen(stripe.port, stripe.host, function() {
      console.info('Mock Stripe API Server v%s listening at %s', stripe.version, stripe.server.url);
      if (callback) {
        return callback();
      }
    });
  };

  stripe.quit = function() {
    console.log('Exiting...');
    stripe.server.close();
  };

  ////////////////////

  process.on('SIGINT', () => {
    stripe.quit();
  });
}

module.exports = StripeServer;
