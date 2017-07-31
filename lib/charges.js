'use strict';

function Charges(stripe) {
  const self = this;

  self.getCharge = function(req, res, next) {
    const charge = stripe.store.getCharge(req.authorization.identity, req.params.charge);
    if (!charge) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such charge: ${ charge }`,
        param: 'charge',
        req: req,
        res: res,
        next: next
      });
    }

    const card = stripe.store.getCard(req.authorization.identity, charge.source);

    const response = stripe.util.clone(charge);
    response.source = card;

    res.send(200, response);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/charges/:charge', stripe.auth.requireAdmin, self.getCharge);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Charges(stripe);
};
