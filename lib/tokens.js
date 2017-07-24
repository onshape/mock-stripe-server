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

    const card = {
      id: 'card_' + stripe.util.generateUniqueId(24),
      object: 'card',
      address_city: req.body.card.address_city || null,
      address_country: req.body.card.address_country || null,
      address_line1: req.body.card.address_line1 || null,
      address_line1_check: (req.body.card.address_line1) ? 'unchecked' : null,
      address_line2: req.body.card.address_line2 || null,
      address_state: req.body.card.address_state || null,
      address_zip: req.body.card.address_zip || null,
      address_zip_check: (req.body.card.address_zip) ? 'unchecked' : null,
      brand: cardType.brand,
      country: cardType.country,
      cvc_check: 'unchecked',
      dynamic_last4: null,
      exp_month: Number(req.body.card.exp_month),
      exp_year: Number(req.body.card.exp_year),
      fingerprint: stripe.util.generateUniqueId(16),
      funding: cardType.funding,
      last4: req.body.card.number.replace(/^(.*)(\d\d\d\d)$/g, '$2'),
      metadata: req.body.metadata || {},
      name: req.body.card.name || null,
      tokenization_method: null
    };

    const token = {
      id: 'tok_' + stripe.util.generateUniqueId(24),
      object: 'token',
      card: card.id,
      client_ip: req.connection.remoteAddress,
      created: stripe.util.timestamp(),
      livemode: false,
      type: 'card',
      used: false
    };

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