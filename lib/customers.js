'use strict';

const errors = require('restify-errors');

function Customers(stripe) {
  const self = this;

  self.addSources = function(identity, customer) {
    const cards = stripe.store.findCards(identity, { customer: customer.id });

    customer.sources = {
      object: 'list',
      data: cards,
      has_more: false,
      total_count: cards.length,
      url: `/v1/customers/${ customer.id }/sources`
    };

    return customer;
  };

  self.addSubscriptions = function(identity, customer) {
    customer.subscriptions = {
      object: 'list',
      data: [],
      has_more: false,
      total_count: 0,
      url: `/v1/customers/${ customer.id }/subscriptions`
    };

    return customer;
  };

  self.createCustomer = function(req, res, next) {
    stripe.util.logger(req);

    let token;
    let card;
    if (req.body.source) {
      token = stripe.store.getToken(req.authorization.identity, req.body.source);
      if (!token) {
        return next(new errors.BadRequestError());
      }
      card = stripe.store.getCard(req.authorization.identity, token.card);
      if (!card) {
        return next(new errors.BadRequestError());
      }
    }

    const id = 'cus_' + stripe.util.generateUniqueId(24);

    const customer = {
      id: id,
      object: 'customer',
      account_balance: 0,
      created: stripe.util.timestamp(),
      currency: 'usd',
      default_source: (card) ? card.id : null,
      delinquent: false,
      description: req.body.description || null,
      discount: null,
      email: req.body.email || null,
      livemode: false,
      metadata: req.body.metadata || {},
      shipping: req.body.shipping || null
    };

    if (card) {
      token.used = true;
      stripe.store.updateToken(req.authorization.identity, token.id, token);

      card.customer = customer.id;
      stripe.store.updateCard(req.authorization.identity, card.id, card);
    }

    stripe.store.addCustomer(req.authorization.identity, customer.id, customer);

    const response = stripe.util.clone(customer);
    self.addSources(req.authorization.identity, response);
    self.addSubscriptions(req.authorization.identity, response);

    res.send(200, response);
    next();
  };

  self.retrieveCustomer = function(req, res, next) {
    stripe.util.logger(req);
    const customer = stripe.store.getCustomer(req.authorization.identity, req.params.id);
    if (!customer) {
      return next(new errors.NotFoundError());
    }

    const response = stripe.util.clone(customer);
    self.addSources(req.authorization.identity, response);
    self.addSubscriptions(req.authorization.identity, response);

    res.send(200, response);
    next();
  };

  self.updateCustomer = function(req, res, next) {
    stripe.util.logger(req);
    const customer = stripe.store.updateCustomer(req.authorization.identity, req.params.id, req.body);
    if (!customer) {
      return next(new errors.NotFoundError());
    }

    res.send(200, customer);
    next();
  };

  self.deleteCustomer = function(req, res, next) {
    stripe.util.logger(req);
    const deleted = stripe.store.deleteCustomer(req.authorization.identity, req.params.id);
    if (!deleted) {
      return next(new errors.NotFoundError());
    }

    const response = {
      deleted: true,
      id: req.params.id
    };

    res.send(200, response);
    next();
  };

  self.listAllCustomers = function(req, res, next) {
    stripe.util.logger(req);
    const customers = stripe.store.getCustomers(req.authorization.identity);
    const results = {
      object: 'list',
      url: '/v1/customers',
      has_more: false,
      data: customers
    };
    res.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/customers', stripe.auth.requireAdmin, self.createCustomer);
  stripe.server.get('/v1/customers/:id', self.retrieveCustomer);
  stripe.server.post('/v1/customers/:id', stripe.auth.requireAdmin, self.updateCustomer);
  stripe.server.del('/v1/customers/:id', stripe.auth.requireAdmin, self.deleteCustomer);
  stripe.server.get('/v1/customers', self.listAllCustomers);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Customers(stripe);
};
