'use strict';

const errors = require('restify-errors');

function Plans(stripe) {
  const self = this;

  self.createPlan = function(req, res, next) {
    stripe.util.logger(req);
    if (!req.body.id || !req.body.amount || !req.body.currency ||
        !req.body.interval || !req.body.name) {
      return next(new errors.BadRequestError());
    }

    if (stripe.store.getPlan(req.authorization.identity, req.body.id)) {
      return next(new errors.ConflictError());
    }

    const plan = {
      id: req.body.id,
      object: 'plan',
      amount: Number(req.body.amount) || 0,
      created: stripe.util.timestamp(),
      currency: req.body.currency,
      interval: req.body.interval,
      interval_count: Number(req.body.interval_count) || 1,
      livemode: false,
      metadata: req.body.metadata || {},
      name: req.body.name,
      statement_descriptor: req.body.statement_descriptor || null,
      trial_period_days: Number(req.body.trial_period_days) || null
    };

    stripe.store.addPlan(req.authorization.identity, plan.id, plan);

    res.send(200, plan);
    next();
  };

  self.retrievePlan = function(req, res, next) {
    stripe.util.logger(req);
    const plan = stripe.store.getPlan(req.authorization.identity, req.params.id);
    if (!plan) {
      return next(new errors.NotFoundError());
    }

    res.send(200, plan);
    next();
  };

  self.updatePlan = function(req, res, next) {
    stripe.util.logger(req);
    const plan = stripe.store.updatePlan(req.authorization.identity, req.params.id, req.body);
    if (!plan) {
      return next(new errors.NotFoundError());
    }

    res.send(200, plan);
    next();
  };

  self.deletePlan = function(req, res, next) {
    stripe.util.logger(req);
    const deleted = stripe.store.deletePlan(req.authorization.identity, req.params.id);
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

  self.listAllPlans = function(req, res, next) {
    stripe.util.logger(req);
    const plans = stripe.store.getPlans(req.authorization.identity);
    const results = {
      object: 'list',
      url: '/v1/plans',
      has_more: false,
      data: plans
    };
    res.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/plans', stripe.auth.requireAdmin, self.createPlan);
  stripe.server.get('/v1/plans/:id', self.retrievePlan);
  stripe.server.post('/v1/plans/:id', stripe.auth.requireAdmin, self.updatePlan);
  stripe.server.del('/v1/plans/:id', stripe.auth.requireAdmin, self.deletePlan);
  stripe.server.get('/v1/plans', self.listAllPlans);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Plans(stripe);
};
