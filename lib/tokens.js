'use strict';

const errors = require('restify-errors');

function Tokens(stripe) {
  const self = this;

  self.createToken = function(req, res, next) {
    if (!req.body.card || !req.body.card.number ||
        !req.body.card.exp_month || !req.body.card.exp_year ||
        !req.body.card.cvc) {
      return next(new errors.BadRequestError());
    }

    const cardType = stripe.data.cards[req.body.card.number];
    if (!cardType) {
      return next(new errors.BadRequestError());
    }

    const card = stripe.model.card({
      card: req.body.card,
      type: cardType,
      metadata: req.body.metadata
    });
    const token = stripe.model.token({
      card: card.id,
      clientIp: req.connection.remoteAddress
    });

    stripe.store.addCard(req.authorization.identity, card.id, card);
    stripe.store.addToken(req.authorization.identity, token.id, token);

    const response = Object.assign({}, token);
    response.card = card;

    res.send(200, response);
    next();
  };

  self.retrieveToken = function(req, res, next) {
    const token = stripe.store.getToken(req.authorization.identity, req.params.id);
    if (!token) {
      return next(new errors.NotFoundError());
    }

    const card = stripe.store.getCard(req.authorization.identity, token.card);
    if (!card) {
      return next(new errors.NotFoundError());
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
