'use strict';

function Plans(stripe) {
  const self = this;

  self.createPlan = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    if (!req.body.id || !req.body.amount || !req.body.currency ||
        !req.body.interval || !req.body.name) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: missing plan fields',
        param: 'plan',
        context: context
      });
    }

    if (stripe.store.getPlan(context.identity, req.body.id)) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: plan ${ req.params.plan } already exists`,
        param: 'id',
        context: context
      });
    }

    const plan = stripe.model.plan({
      context: context,
      id: req.body.id,
      amount: req.body.amount,
      currency: req.body.currency,
      interval: req.body.interval,
      name: req.body.name,
      interval_count: req.body.interval_count || 1,
      metadata: req.body.metadata || {},
      statement_descriptor: req.body.statement_descriptor || null,
      trial_period_days: req.body.trial_period_days || null
    });

    stripe.model.event({
      context: context,
      type: 'plan.created',
      object: plan
    });

    context.send(200, plan);
    next();
  };

  self.retrievePlan = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const plan = stripe.store.getPlan(context.identity, req.params.plan);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.plan }`,
        param: 'id',
        context: context
      });
    }

    context.send(200, plan);
    next();
  };

  self.updatePlan = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    let plan = stripe.store.getPlan(context.identity, req.params.plan);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.plan }`,
        param: 'plan',
        context: context
      });
    }

    const fields = [ 'metadata', 'name', 'statement_descriptor', 'trial_period_days' ];

    const [ update, previous ] = stripe.util.createUpdateObject(fields, plan, req.body);

    plan = stripe.store.updatePlan(context.identity, req.params.plan, update);

    stripe.model.event({
      context: context,
      type: 'plan.updated',
      object: plan,
      previous: previous
    });

    context.send(200, plan);
    next();
  };

  self.deletePlan = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    let plan = stripe.store.getPlan(context.identity, req.params.plan);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan ${ req.params.plan }`,
        param: 'plan',
        context: context
      });
    }

    plan = stripe.store.deletePlan(context.identity, req.params.plan);

    stripe.model.event({
      context: context,
      type: 'plan.deleted',
      object: plan
    });

    const response = {
      deleted: true,
      id: req.params.plan
    };

    context.send(200, response);
    next();
  };

  self.listAllPlans = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const plans = stripe.store.getPlans(context.identity);
    const results = stripe.model.list({
      items: plans,
      url: '/v1/plans',
      paginate: true,
      query: req.query
    });
    context.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/plans', stripe.auth.requireAdmin, self.createPlan);
  stripe.server.get('/v1/plans/:plan', self.retrievePlan);
  stripe.server.post('/v1/plans/:plan', stripe.auth.requireAdmin, self.updatePlan);
  stripe.server.del('/v1/plans/:plan', stripe.auth.requireAdmin, self.deletePlan);
  stripe.server.get('/v1/plans', self.listAllPlans);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Plans(stripe);
};
