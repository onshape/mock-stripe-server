'use strict';

const errors = require('restify-errors');

function Coupons(stripe) {
  const self = this;

  self.createCoupon = function(req, res, next) {
    if (!req.body.duration || !((req.body.amount_off && req.body.currency) || req.body.percent_off) ||
        (req.body.percent_off && req.body.amount_off) ||
        (req.body.duration === 'repeating' && !req.body.duration_in_months)) {
      return next(new errors.BadRequestError());
    }

    if (stripe.store.getCoupon(req.authorization.identity, req.body.id)) {
      return next(new errors.ConflictError());
    }

    const coupon = stripe.model.coupon(req.body);
    stripe.store.addCoupon(req.authorization.identity, coupon.id, coupon);

    res.send(200, coupon);
    next();
  };

  self.retrieveCoupon = function(req, res, next) {
    const coupon = stripe.store.getCoupon(req.authorization.identity, req.params.id);
    if (!coupon) {
      return next(new errors.NotFoundError());
    }

    res.send(200, coupon);
    next();
  };

  self.updateCoupon = function(req, res, next) {
    const coupon = stripe.store.updateCoupon(req.authorization.identity, req.params.id, req.body);
    if (!coupon) {
      return next(new errors.NotFoundError());
    }

    res.send(200, coupon);
    next();
  };

  self.deleteCoupon = function(req, res, next) {
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
    const coupons = stripe.store.getCoupons(req.authorization.identity);
    const results = stripe.model.list({
      items: coupons,
      url: '/v1/coupons'
    });
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
