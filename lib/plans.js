'use strict';

function Plans(stripe) {
  const self = this;

  self.createPlan = function(req, res, next) {
    if (!req.body.id || !req.body.amount || !req.body.currency ||
        !req.body.interval || !req.body.name) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: missing plan fields',
        param: 'plan',
        req: req,
        res: res,
        next: next
      });
    }

    if (stripe.store.getPlan(req.authorization.identity, req.body.id)) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: plan ${ req.params.id } already exists`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    const plan = stripe.model.plan(req.body);

    stripe.store.addPlan(req.authorization.identity, plan.id, plan);

    res.send(200, plan);
    next();
  };

  self.retrievePlan = function(req, res, next) {
    const plan = stripe.store.getPlan(req.authorization.identity, req.params.id);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.id }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    res.send(200, plan);
    next();
  };

  self.updatePlan = function(req, res, next) {
    const plan = stripe.store.updatePlan(req.authorization.identity, req.params.id, req.body);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.id }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    res.send(200, plan);
    next();
  };

  self.deletePlan = function(req, res, next) {
    const deleted = stripe.store.deletePlan(req.authorization.identity, req.params.id);
    if (!deleted) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.id }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    const response = {
      deleted: true,
      id: req.params.id
    };

    res.send(200, response);
    next();
  };

  self.listAllPlans = function(req, res, next) {
    const plans = stripe.store.getPlans(req.authorization.identity);
    const results = stripe.model.list({
      items: plans,
      url: '/v1/plans',
      paginate: true,
      query: req.query
    });
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
