'use strict';

const errors = require('restify-errors');

function Customers(stripe) {
  const self = this;

  self.addSources = function(identity, customer) {
    const cards = stripe.store.findCards(identity, {
      customer: customer.id
    });

    customer.sources = stripe.model.list({
      items: cards,
      url: `/v1/customers/${ customer.id }/sources`
    });

    return customer;
  };

  self.addSubscriptions = function(identity, customer) {
    customer.subscriptions = stripe.model.list({
      url: `/v1/customers/${ customer.id }/subscriptions`
    });

    return customer;
  };

  self.createCustomer = function(req, res, next) {
    const tokenId = req.body.source || req.body.card;
    let token;
    let card;

    if (tokenId) {
      token = stripe.store.getToken(req.authorization.identity, tokenId);
      if (!token) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: token ${ tokenId } not found`,
          param: 'card',
          req: req,
          res: res,
          next: next
        });
      }

      card = stripe.store.getCard(req.authorization.identity, token.card);
      if (!card) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: card ${ token.card } not found`,
          param: 'card',
          req: req,
          res: res,
          next: next
        });
      }
    }

    const customer = stripe.model.customer({
      token: token,
      card: card,
      description: req.body.description,
      email: req.body.email,
      metadata: req.body.metadata,
      shipping: req.body.shipping
    });

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
    const customer = stripe.store.updateCustomer(req.authorization.identity, req.params.id, req.body);
    if (!customer) {
      return next(new errors.NotFoundError());
    }

    const response = stripe.util.clone(customer);
    self.addSources(req.authorization.identity, response);
    self.addSubscriptions(req.authorization.identity, response);

    res.send(200, response);
    next();
  };

  self.deleteCustomer = function(req, res, next) {
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
    const customers = stripe.store.getCustomers(req.authorization.identity);
    const results = stripe.model.list({
      items: customers,
      url: '/v1/customers'
    });
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
