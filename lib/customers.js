'use strict';

function Customers(stripe) {
  const self = this;

  self.addSources = function(identity, customer) {
    const cards = stripe.store.findCards(identity, {
      customer: customer.id,
      id: customer.default_source
    }).sort(function(a, b) {
      if (a.id === customer.default_source) {
        return -1;
      } else if (b.id === customer.default_source) {
        return 1;
      }
      return 0;
    });

    customer.sources = stripe.model.list({
      items: cards,
      url: `/v1/customers/${ customer.id }/sources`
    });

    return customer;
  };

  self.addSubscriptions = function(identity, customer) {
    let subscriptions = stripe.store.findSubscriptions(identity, {
      customer: customer.id
    });

    subscriptions = subscriptions.map(function(subscription) {
      subscription = stripe.subscriptions.populateSubscription(identity, subscription);
      return subscription;
    });

    customer.subscriptions = stripe.model.list({
      items: subscriptions,
      url: `/v1/customers/${ customer.id }/subscriptions`
    });

    return customer;
  };

  self.addDiscount = function(identity, customer) {
    let discount = stripe.store.getDiscount(identity, customer.id);
    if (discount) {
      discount = stripe.util.clone(discount);
      discount.coupon = stripe.store.getCoupon(identity, discount.coupon);
      customer.discount = discount;
    }
    return customer;
  };

  self.createCustomer = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const tokenId = req.body.source || req.body.card;
    let token;
    let card;

    if (tokenId) {
      token = stripe.store.getToken(context.identity, tokenId);
      if (!token) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: token ${ tokenId } not found`,
          param: 'card',
          context: context
        });
      }

      card = stripe.store.getCard(context.identity, token.card);
      if (!card) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: card ${ token.card } not found`,
          param: 'card',
          context: context
        });
      }
    }

    const customer = stripe.model.customer({
      context: context,
      token: token,
      card: card,
      description: req.body.description,
      email: req.body.email,
      metadata: req.body.metadata,
      shipping: req.body.shipping
    });

    stripe.model.event({
      context: context,
      type: 'customer.created',
      object: customer
    });

    if (card) {
      token.used = true;
      stripe.store.updateToken(context.identity, token.id, token);

      card.customer = customer.id;
      stripe.store.updateCard(context.identity, card.id, card);
      stripe.model.event({
        context: context,
        type: 'customer.source.created',
        object: card
      });
    }

    const response = stripe.util.clone(customer);
    self.addSources(context.identity, response);
    self.addSubscriptions(context.identity, response);
    self.addDiscount(context.identity, response);

    context.send(200, response);
    next();
  };

  self.retrieveCustomer = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'customer',
        context: context
      });
    }

    const response = stripe.util.clone(customer);
    self.addSources(context.identity, response);
    self.addSubscriptions(context.identity, response);
    self.addDiscount(context.identity, response);

    context.send(200, response);
    next();
  };

  self.updateCustomer = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const tokenId = req.body.source || req.body.card;
    let token;
    let card;

    if (tokenId) {
      delete req.body.source;
      delete req.body.card;

      token = stripe.store.getToken(context.identity, tokenId);
      if (!token) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: token ${ tokenId } not found`,
          param: 'card',
          context: context
        });
      }

      card = stripe.store.getCard(context.identity, token.card);
      if (!card) {
        return stripe.errors.invalidRequestError({
          statusCode: 404,
          message: `Error: card ${ token.card } not found`,
          param: 'card',
          context: context
        });
      }
    }

    let customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'customer',
        context: context
      });
    }

    if (card) {
      token.used = true;
      stripe.store.updateToken(context.identity, token.id, token);

      card.customer = customer.id;
      stripe.store.updateCard(context.identity, card.id, card);

      stripe.model.event({
        context: context,
        type: 'customer.source.created',
        object: card
      });

      req.body.default_source = card.id;
    }

    const fields = [ 'account_balance', 'business_vat_id', 'default_source',
      'description', 'email', 'metadata', 'shipping' ];

    const [ update, previous ] = stripe.util.createUpdateObject(fields, customer, req.body);

    customer = stripe.store.updateCustomer(context.identity, req.params.customer, update);

    stripe.model.event({
      context: context,
      type: 'customer.updated',
      object: customer,
      previous: previous
    });

    const response = stripe.util.clone(customer);
    self.addSources(context.identity, response);
    self.addSubscriptions(context.identity, response);
    self.addDiscount(context.identity, response);

    context.send(200, response);
    next();
  };

  self.deleteCustomer = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    let customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'customer',
        context: context
      });
    }

    customer = stripe.store.deleteCustomer(context.identity, req.params.customer);
    stripe.model.event({
      context: context,
      type: 'customer.deleted',
      object: customer
    });

    const response = {
      deleted: true,
      id: req.params.customer
    };

    context.send(200, response);
    next();
  };

  self.listAllCustomers = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const customers = stripe.store.getCustomers(context.identity);
    const results = stripe.model.list({
      items: customers,
      url: '/v1/customers',
      paginate: true,
      query: req.query
    });

    context.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/customers', stripe.auth.requireAdmin, self.createCustomer);
  stripe.server.get('/v1/customers/:customer', self.retrieveCustomer);
  stripe.server.post('/v1/customers/:customer', stripe.auth.requireAdmin, self.updateCustomer);
  stripe.server.del('/v1/customers/:customer', stripe.auth.requireAdmin, self.deleteCustomer);
  stripe.server.get('/v1/customers', self.listAllCustomers);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Customers(stripe);
};
