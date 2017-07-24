'use strict';

const errors = require('restify-errors');

function Coupons(stripe) {
  const self = this;

  self.createCoupon = function(req, res, next) {
    stripe.util.logger(req);
    if (!req.body.duration || !((req.body.amount_off && req.body.currency) || req.body.percent_off) ||
        (req.body.percent_off && req.body.amount_off) ||
        (req.body.duration === 'repeating' && !req.body.duration_in_months)) {
      return next(new errors.BadRequestError());
    }

    if (stripe.store.getCoupon(req.authorization.identity, req.body.id)) {
      return next(new errors.ConflictError());
    }

    const coupon = {
      id: req.body.id || 'cou_' + stripe.util.generateUniqueId(24),
      object: 'coupon',
      amount_off: Number(req.body.amount_off) || null,
      created: stripe.util.timestamp(),
      currency: req.body.currency || null,
      duration: req.body.duration,
      duration_in_months: Number(req.body.duration_in_months) || null,
      livemode: false,
      max_redemptions: Number(req.body.max_redemptions) || null,
      metadata: req.body.metadata || {},
      percent_off: Number(req.body.percent_off) || null,
      redeem_by: Number(req.body.redeem_by) || null,
      times_redeemed: 0,
      valid: true
    };

    stripe.store.addCoupon(req.authorization.identity, coupon.id, coupon);

    res.send(200, coupon);
    next();
  };

  self.retrieveCoupon = function(req, res, next) {
    stripe.util.logger(req);
    const coupon = stripe.store.getCoupon(req.authorization.identity, req.params.id);
    if (!coupon) {
      return next(new errors.NotFoundError());
    }

    res.send(200, coupon);
    next();
  };

  self.updateCoupon = function(req, res, next) {
    stripe.util.logger(req);
    const coupon = stripe.store.updateCoupon(req.authorization.identity, req.params.id, req.body);
    if (!coupon) {
      return next(new errors.NotFoundError());
    }

    res.send(200, coupon);
    next();
  };

  self.deleteCoupon = function(req, res, next) {
    stripe.util.logger(req);
    const deleted = stripe.store.deleteCoupon(req.authorization.identity, req.params.id);
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

  self.listAllCoupons = function(req, res, next) {
    stripe.util.logger(req);
    const coupons = stripe.store.getCoupons(req.authorization.identity);
    const results = {
      object: 'list',
      url: '/v1/coupons',
      has_more: false,
      data: coupons
    };
    res.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/coupons', stripe.auth.requireAdmin, self.createCoupon);
  stripe.server.get('/v1/coupons/:id', self.retrieveCoupon);
  stripe.server.post('/v1/coupons/:id', stripe.auth.requireAdmin, self.updateCoupon);
  stripe.server.del('/v1/coupons/:id', stripe.auth.requireAdmin, self.deleteCoupon);
  stripe.server.get('/v1/coupons', self.listAllCoupons);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Coupons(stripe);
};
