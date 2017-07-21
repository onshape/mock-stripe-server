'use strict';

const util = require('./util');
const restify = require('restify');

function StripeServer() {
  const self = this;

  self.version = require('../package.json').version;
  self.port = 5757;

  const server = restify.createServer({
    name: 'StripeServer'
  });

  self.requestCount = 0;

  server.use(restify.pre.sanitizePath());
  server.use(restify.plugins.dateParser());
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser());

  server.use(function (req, res, next) {
    res.header('Request-Id', util.getSHA1Hex(`mock-stripe-server-request-${self.requestCount++}`));
    res.header('mock-stripe-server-version', self.version);
    next();
  });

  ////////////////////

  server.on('uncaughtException', function (request, response, route, error) {
    console.log('Stripe Server API ERROR: ' + request.method + ' ' + route.spec.path);
    console.log(error.stack);
  });

  ////////////////////

  self.placeHolder = function(req, res, next) {
    console.log(req.method, req.url);
    if (req.body) {
      console.json(req.body);
    }

    res.send(200, { message: 'ok?' });
    next();
  };

  server.get(/.*/, self.placeHolder);
  server.post(/.*/, self.placeHolder);
  server.put(/.*/, self.placeHolder);
  server.head(/.*/, self.placeHolder);
  server.del(/.*/, self.placeHolder);

  ////////////////////

  self.boot = function(callback) {
    server.listen(self.port, function() {
      console.info('Mock Stripe API Server v%s listening at %s', self.version, server.url);
      if (callback) {
        return callback();
      }
    });
  };

  self.quit = function() {
    server.close();
  };
}

module.exports = StripeServer;