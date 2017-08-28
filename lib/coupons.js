'use strict';

function Coupons(stripe) {
  const self = this;

  self.createCoupon = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    if (!req.body.duration || !((req.body.amount_off && req.body.currency) || req.body.percent_off) ||
        (req.body.percent_off && req.body.amount_off) ||
        (req.body.duration === 'repeating' && !req.body.duration_in_months)) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: Missing coupon fields',
        param: 'coupon',
        context: context
      });
    }

    if (stripe.store.getCoupon(context.identity, req.body.id)) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: Coupon ${ req.body.id } already exists`,
        param: 'coupon',
        context: context
      });
    }

    const coupon = stripe.model.coupon({
      context: context,
      id: req.body.id,
      duration: req.body.duration,
      amount_off: req.body.amount_off || null,
      currency: req.body.currency || null,
      duration_in_months: req.body.duration_in_months || null,
      max_redemptions: req.body.max_redemptions || null,
      metadata: req.body.metadata || {},
      percent_off: req.body.percent_off || null,
      redeem_by: req.body.redeem_by || null
    });

    stripe.model.event({
      context: context,
      type: 'coupon.created',
      object: coupon
    });

    context.send(200, coupon);
    next();
  };

  self.retrieveCoupon = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const coupon = stripe.store.getCoupon(context.identity, req.params.coupon);
    if (!coupon) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: No such coupon ${ req.params.coupon }`,
        param: 'coupon',
        context: context
      });
    }

    context.send(200, coupon);
    next();
  };

  self.updateCoupon = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    let coupon = stripe.store.getCoupon(context.identity, req.params.coupon);
    if (!coupon) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: No such coupon ${ req.params.coupon }`,
        param: 'coupon',
        context: context
      });
    }

    const update = {
      metadata: req.body.metadata
    };

    const previous = {
      metadata: coupon.metadata
    };

    coupon = stripe.store.updateCoupon(context.identity, update);

    stripe.model.event({
      context: context,
      type: 'coupon.updated',
      object: coupon,
      previous: previous
    });

    context.send(200, coupon);
    next();
  };

  self.deleteCoupon = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    let coupon = stripe.store.getCoupon(context.identity, req.params.coupon);
    if (!coupon) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: No such coupon ${ req.params.coupon }`,
        param: 'coupon',
        context: context
      });
    }

    coupon = stripe.store.deleteCoupon(context.identity, req.params.coupon);

    stripe.model.event({
      context: context,
      type: 'coupon.deleted',
      object: coupon
    });

    const response = {
      deleted: true,
      id: req.params.coupon
    };

    context.send(200, response);
    next();
  };

  self.listAllCoupons = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const coupons = stripe.store.getCoupons(context.identity);
    const results = stripe.model.list({
      items: coupons,
      url: '/v1/coupons',
      paginate: true,
      query: req.query
    });

    context.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/coupons', stripe.auth.requireAdmin, self.createCoupon);
  stripe.server.get('/v1/coupons/:coupon', self.retrieveCoupon);
  stripe.server.post('/v1/coupons/:coupon', stripe.auth.requireAdmin, self.updateCoupon);
  stripe.server.del('/v1/coupons/:coupon', stripe.auth.requireAdmin, self.deleteCoupon);
  stripe.server.get('/v1/coupons', self.listAllCoupons);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Coupons(stripe);
};
