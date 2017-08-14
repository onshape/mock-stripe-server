'use strict';

function Tokens(stripe) {
  const self = this;

  self.createToken = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    if (!req.body.card || !req.body.card.number ||
        !req.body.card.exp_month || !req.body.card.exp_year ||
        !req.body.card.cvc) {

      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: Missing card details',
        param: 'card',
        context: context
      });
    }

    const cardType = stripe.data.cards[req.body.card.number];
    if (!cardType) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: Invalid card number',
        param: 'card',
        context: context
      });
    }

    const card = stripe.model.card({
      context: context,
      card: req.body.card,
      type: cardType,
      metadata: req.body.metadata
    });

    const token = stripe.model.token({
      context: context,
      card: card.id,
      clientIp: req.connection.remoteAddress
    });

    const response = stripe.util.clone(token);
    response.card = card;

    context.send(200, response);
    next();
  };

  self.retrieveToken = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const token = stripe.store.getToken(context.identity, req.params.id);
    if (!token) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such token ${ req.params.id }`,
        param: 'id',
        context: context
      });

    }

    const card = stripe.store.getCard(context.identity, token.card);
    if (!card) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such token ${ req.params.id }`,
        param: 'id',
        context: context
      });
    }

    const response = stripe.util.clone(token);
    response.card = card;

    context.send(200, response);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/tokens', self.createToken);
  stripe.server.get('/v1/tokens/:id', self.retrieveToken);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Tokens(stripe);
};
