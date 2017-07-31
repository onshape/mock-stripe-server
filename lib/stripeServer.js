'use strict';

const restify = require('restify');

function StripeServer(config) {
  const stripe = this;

  stripe.apiVersion = '2017-06-05';

  stripe.version = require('../package.json').version;
  stripe.host = '127.0.0.1';
  stripe.port = 5757; // 787473

  stripe.util = require('./util');
  stripe.store = require('./dataStore');
  stripe.data = require('../data');

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

    stripe.util.logger(req);
    next();
  });

  ////////////////////

  stripe.server.on('uncaughtException', function (request, response, route, error) {
    console.log('Stripe Server API ERROR: ' + request.method + ' ' + route.spec.path);
    console.log(error.stack);
  });

  ////////////////////

  stripe.placeHolder = function(req, res, next) {
    res.send(200, {
      message: 'ok?'
    });
    next();
  };

  stripe.server.opts(/.*/, stripe.placeHolder);
  stripe.server.head(/.*/, stripe.placeHolder);

  ////////////////////

  stripe.model = require('./model')(stripe);
  stripe.errors = require('./errors')(stripe);
  stripe.auth = require('./auth')(stripe);
  stripe.tokens = require('./tokens')(stripe);
  stripe.plans = require('./plans')(stripe);
  stripe.coupons = require('./coupons')(stripe);
  stripe.customers = require('./customers')(stripe);
  stripe.subscriptions = require('./subscriptions')(stripe);
  stripe.invoices = require('./invoices')(stripe);
  stripe.charges = require('./charges')(stripe);

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
    stripe.server.close();
  };
}

module.exports = StripeServer;
