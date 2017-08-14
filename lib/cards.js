'use strict';

function Cards(stripe) {
  const self = this;

  self.retrieveCard = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'id',
        context: context
      });
    }

    const card = stripe.store.getCard(context.identity, req.params.card);
    if (!card) {
      return stripe.errors.invalidRequestError({
        statusCode: 404,
        message: `Error: card ${ req.params.card } not found`,
        param: 'card',
        context: context
      });
    }

    if (card.customer !== customer.id) {
      return stripe.errors.invalidRequestError({
        statusCode: 404,
        message: `Error: card ${ req.params.card } not found`,
        param: 'card',
        context: context
      });
    }

    context.send(200, card);
    next();
  };

  self.deleteCard = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'id',
        context: context
      });
    }

    const card = stripe.store.getCard(context.identity, req.params.card);
    if (!card) {
      return stripe.errors.invalidRequestError({
        statusCode: 404,
        message: `Error: card ${ req.params.card } not found`,
        param: 'card',
        context: context
      });
    }

    if (card.customer !== customer.id) {
      return stripe.errors.invalidRequestError({
        statusCode: 404,
        message: `Error: card ${ req.params.card } not found`,
        param: 'card',
        context: context
      });
    }

    if (customer.default_source === card.id) {
      customer.default_source = null;

      stripe.store.updateCustomer(context.identity, customer.id, customer);
    }

    stripe.store.deleteCard(context.identity, card.id);

    const response = {
      delete: true,
      id: card.id
    };

    context.send(200, response);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/customers/:customer/sources/:card', stripe.auth.requireAdmin, self.retrieveCard);
  stripe.server.del('/v1/customers/:customer/sources/:card', stripe.auth.requireAdmin, self.deleteCard);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Cards(stripe);
};
