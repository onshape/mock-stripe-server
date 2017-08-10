'use strict';

function Tokens(stripe) {
  const self = this;

  self.createToken = function(req, res, next) {
    if (!req.body.card || !req.body.card.number ||
        !req.body.card.exp_month || !req.body.card.exp_year ||
        !req.body.card.cvc) {

      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: Missing card details',
        param: 'card',
        req: req,
        res: res,
        next: next
      });
    }

    const cardType = stripe.data.cards[req.body.card.number];
    if (!cardType) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: Invalid card number',
        param: 'card',
        req: req,
        res: res,
        next: next
      });
    }

    const card = stripe.model.card({
      identity: req.authorization.identity,
      card: req.body.card,
      type: cardType,
      metadata: req.body.metadata
    });

    const token = stripe.model.token({
      identity: req.authorization.identity,
      card: card.id,
      clientIp: req.connection.remoteAddress
    });

    const response = stripe.util.clone(token);
    response.card = card;

    res.send(200, response);
    next();
  };

  self.retrieveToken = function(req, res, next) {
    const token = stripe.store.getToken(req.authorization.identity, req.params.id);
    if (!token) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such token ${ req.params.id }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });

    }

    const card = stripe.store.getCard(req.authorization.identity, token.card);
    if (!card) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such token ${ req.params.id }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    const response = stripe.util.clone(token);
    response.card = card;

    res.send(200, response);
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
