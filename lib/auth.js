'use strict';

const errors = require('restify-errors');

function Auth(stripe) {
  const self = this;

  const defaultKey = {
    name: 'default',
    secretKey: /sk_test_.*/,
    publishableKey: /pk_test_.*/
  };

  self.keyMatch = function(key, value) {
    if (key instanceof RegExp) {
      return key.test(value);
    } else {
      return key === value;
    }
  };

  self.validateApiKey = function(req, res, next) {
    if (req.authorization) {
      if (req.authorization.scheme === 'Basic') {
        req.authorization.apiKey = req.authorization.basic.username;
      } else if (req.authorization.scheme === 'Bearer') {
        req.authorization.apiKey = req.authorization.credentials;
      } else {
        return next(new errors.UnauthorizedError());
      }

      const keys = stripe.store.getKeys();
      for (const identity in keys) {
        if (self.keyMatch(identity.secretKey, req.authorization.apiKey)) {
          req.authorization.identity = identity.name;
          req.authorization.admin = true;
          return next();
        } else if (self.keyMatch(identity.publishableKey, req.authorization.apiKey)) {
          req.authorization.identity = identity.name;
          req.authorization.admin = false;
          return next();
        }
      }

      if (self.keyMatch(defaultKey.secretKey, req.authorization.apiKey)) {
        req.authorization.identity = defaultKey.name;
        req.authorization.admin = true;
        return next();
      } else if (self.keyMatch(defaultKey.publishableKey, req.authorization.apiKey)) {
        req.authorization.identity = defaultKey.name;
        req.authorization.admin = false;
        return next();
      }
    }
    return next(new errors.UnauthorizedError());
  };

  self.requireAdmin = function(req, res, next) {
    if (!req.authorization || !req.authorization.admin) {
      return next(new errors.UnauthorizedError());
    }
    return next();
  };

  stripe.server.use(self.validateApiKey);

  return self;
}

module.exports = function(stripe) {
  return new Auth(stripe);
};