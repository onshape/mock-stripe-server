'use strict';

const fs = require('fs');
const restify = require('restify');

function StripeServer(options, config) {
  const stripe = this;

  stripe.version = require('../package.json').version;

  stripe.options = {
    apiVersion: '2017-06-05',
    name: 'mock-stripe-server',
    host: '0.0.0.0',
    port: 5757,
    livemode: false,
    silent: false
  };

  stripe.util = require('./util');
  stripe.data = require('../data');

  stripe.store = require('./dataStore')(stripe);

  stripe.server = restify.createServer({
    name: stripe.options.name
  });

  stripe.server.use(restify.pre.sanitizePath());
  stripe.server.use(restify.plugins.dateParser());
  stripe.server.use(restify.plugins.queryParser());
  stripe.server.use(restify.plugins.bodyParser());
  stripe.server.use(restify.plugins.authorizationParser());

  stripe.ui = require('./ui')(stripe);

  stripe.server.use(function (req, res, next) {
    const requestId = 'req_' + stripe.store.generateId(24);
    req.requestId = requestId;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT');
    res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');

    res.header('Request-Id', requestId);
    res.header('mock-stripe-server-version', stripe.version);
    res.header('Stripe-Version', stripe.options.apiVersion);

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

  if (options) {
    Object.assign(stripe.options, options);

    stripe.options.livemode = stripe.util.toBoolean(stripe.options.livemode);
    stripe.options.silent = stripe.util.toBoolean(stripe.options.silent);

    stripe.store.loadStore();
  }

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

  stripe.writePid = function() {
    if (stripe.options.pidFile) {
      try {
        fs.writeFileSync(stripe.options.pidFile, process.pid);
      } catch (error) {
        // no complaint
      }
    }
  };

  stripe.clearPid = function() {
    if (stripe.options.pidFile) {
      try {
        fs.unlinkSync(stripe.options.pidFile);
      } catch (error) {
        // no compaint
      }
    }
  };

  ////////////////////

  stripe.boot = function(callback) {
    process.title = stripe.options.name;
    stripe.server.listen(stripe.options.port, stripe.options.host, function(error) {
      if (!error) {
        stripe.writePid();
        console.info('Mock Stripe API Server v%s listening at %s',
          stripe.version, stripe.server.url);

      }
      if (callback) {
        return callback(error);
      }
    });
  };

  stripe.quit = function() {
    console.log('Exiting...');
    stripe.server.close();
    stripe.store.writeStore();
    stripe.clearPid();
    process.exit(0);
  };

  ////////////////////

  process.on('SIGINT', () => {
    stripe.quit();
  });
}

module.exports = StripeServer;
