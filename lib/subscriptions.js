'use strict';

function Subscriptions(stripe) {
  const self = this;

  self.populateSubscription = function(identity, subscription) {
    const response = stripe.util.clone(subscription);

    for (const item of response.items.data) {
      item.plan = stripe.store.getPlan(identity, item.plan);
    }
    response.plan = stripe.store.getPlan(identity, response.plan);

    if (response.discount) {
      response.discount.coupon = stripe.store.getCoupon(identity, response.discount.coupon);
    }

    return response;
  };

  self.createSubscription = function(req, res, next) {
    const customerId = req.params.customer || req.body.customer;
    const planId = req.body.plan;

    if (!customerId) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no customer specified',
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }
    if (!planId) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no plan specified',
        param: 'plan',
        req: req,
        res: res,
        next: next
      });
    }

    const customer = stripe.store.getCustomer(req.authorization.identity, customerId);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer: ${ customerId }`,
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }

    const plan = stripe.store.getPlan(req.authorization.identity, planId);
    if (!plan) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such plan: ${ planId }`,
        param: 'plan',
        req: req,
        res: res,
        next: next
      });
    }

    const coupon = stripe.store.getCoupon(req.authorization.identity, req.body.coupon);

    const subscription = stripe.model.subscription({
      identity: req.authorization.identity,
      customer: customer,
      plan: plan,
      coupon: coupon,
      metadata: req.body.metadata,
      quantity: req.body.quantity
    });

    stripe.model.invoice({
      identity: req.authorization.identity,
      customer: customer,
      subscription: subscription
    });

    const response = self.populateSubscription(req.authorization.identity, subscription);
    res.send(200, response);
    next();
  };

  self.retrieveSubscription = function(req, res, next) {
    let subscriptionId;
    let customerId;

    if (req.params) {
      if (req.params.subscription) {
        subscriptionId = req.params.subscription;
      }
      if (req.params.customer) {
        customerId = req.params.customer;
      }
    }
    if (req.body) {
      if (req.body.subscription) {
        subscriptionId = req.body.subscription;
      }
      if (req.body.customer) {
        customerId = req.body.customer;
      }
    }

    const subscription = stripe.store.getSubscription(req.authorization.identity, subscriptionId);
    if (!subscription) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such subscription ${ subscriptionId }`,
        param: 'subscription',
        req: req,
        res: res,
        next: next
      });
    }

    if (!customerId) {
      customerId = subscription.customer;
    }

    const customer = stripe.store.getCustomer(req.authorization.identity, customerId);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ customerId }`,
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }

    const response = self.populateSubscription(req.authorization.identity, subscription);

    res.send(200, response);
    next();
  };

  self.updateSubscription = function(req, res, next) {
    const subscriptionId = req.params.subscription || req.body.subscription;
    let subscription = stripe.store.getSubscription(req.authorization.identity, subscriptionId);

    if (!subscription) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such subscription ${ subscriptionId }`,
        param: 'subscription',
        req: req,
        res: res,
        next: next
      });
    }

    let coupon = req.body.coupon;
    if (coupon) {
      delete req.body.coupon;
      coupon = stripe.store.getCoupon(req.authorization.identity, coupon);

      req.body.discount = stripe.model.discount({
        identity: req.authorization.identity,
        customer: subscription.customer,
        subscription: subscription.id,
        coupon: coupon
      });
    } else if (coupon === null) {
      stripe.store.deleteDiscount(req.authorization.identity, subscription.customer);
      req.body.discount = null;
    }

    subscription = stripe.store.updateSubscription(req.authorization.identity, subscriptionId, req.body);

    const response = self.populateSubscription(req.authorization.identity, subscription);
    res.send(200, response);
    next();
  };

  self.cancelSubscription = function(req, res, next) {
    const subscriptionId = req.params.subscription || req.body.subscription;
    const subscription = stripe.store.getSubscription(req.authorization.identity, subscriptionId);
    if (!subscription) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such subscription ${ subscriptionId }`,
        param: 'subscription',
        req: req,
        res: res,
        next: next
      });
    }

    subscription.canceled_at = stripe.util.timestamp();
    if (req.query && stripe.util.toBoolean(req.query.at_period_end)) {
      subscription.cancel_at_period_end = true;
    } else {
      subscription.status = 'canceled';
      subscription.ended_at = subscription.canceled_at;
    }

    stripe.store.updateSubscription(req.authorization.identity, subscription.id, subscription);

    const response = self.populateSubscription(req.authorization.identity, subscription);
    res.send(200, response);
    next();
  };

  self.listSubscriptions = function(req, res, next) {
    let subscriptions = stripe.store.getSubscriptions(req.authorization.identity);
    subscriptions = subscriptions.map((subscription) => self.populateSubscription(req.authorization.identity, subscription));
    const results = stripe.model.list({
      items: subscriptions,
      url: '/v1/subscriptions',
      paginate: true,
      query: req.query
    });

    res.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/subscriptions', stripe.auth.requireAdmin, self.createSubscription);
  stripe.server.post('/v1/customers/:customer/subscriptions', stripe.auth.requireAdmin, self.createSubscription);

  stripe.server.get('/v1/subscriptions/:subscription', stripe.auth.requireAdmin, self.retrieveSubscription);
  stripe.server.get('/v1/customers/:customer/subscriptions/:subscription', stripe.auth.requireAdmin, self.retrieveSubscription);

  stripe.server.post('/v1/subscriptions/:subscription', stripe.auth.requireAdmin, self.updateSubscription);
  stripe.server.post('/v1/customers/:customer/subscriptions/:subscription', stripe.auth.requireAdmin, self.updateSubscription);

  stripe.server.del('/v1/subscriptions/:subscription', stripe.auth.requireAdmin, self.cancelSubscription);
  stripe.server.del('/v1/customers/:customer/subscriptions/:subscription', stripe.auth.requireAdmin, self.cancelSubscription);

  stripe.server.get('/v1/subscriptions', stripe.auth.requireAdmin, self.listSubscriptions);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Subscriptions(stripe);
};
