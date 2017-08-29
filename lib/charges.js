'use strict';

function Charges(stripe) {
  const self = this;

  self.retrieveCharge = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const charge = stripe.store.getCharge(context.identity, req.params.charge);
    if (!charge) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such charge: ${ charge }`,
        param: 'charge',
        context: context
      });
    }

    const card = stripe.store.getCard(context.identity, charge.source);

    const response = stripe.util.clone(charge);
    response.source = card;

    context.send(200, response);
    next();
  };

  self.listAllCharges = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const charges = stripe.store.getCharges(context.identity);
    const results = stripe.model.list({
      items: charges,
      url: '/v1/charges',
      paginate: true,
      query: req.query
    });

    context.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/charges/:charge', stripe.auth.requireAdmin, self.retrieveCharge);
  stripe.server.get('/v1/charges', stripe.auth.requireAdmin, self.listAllCharges);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Charges(stripe);
};
