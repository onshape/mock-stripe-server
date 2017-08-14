'use strict';

function Discounts(stripe) {
  const self = this;

  self.deleteCustomerDiscount = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    const customer = stripe.store.getCustomer(context.identity, req.params.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ req.params.customer }`,
        param: 'customer',
        context: context
      });
    }

    let discount = stripe.store.findDiscounts(context.identity, {
      customer: customer.id
    });
    if (!discount.length) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no discount customer ${ req.params.customer }`,
        param: 'customer',
        context: context
      });
    }
    discount = discount[0];

    discount = stripe.store.deleteDiscount(context.identity, discount.id);
    stripe.model.event({
      context: context,
      type: 'customer.discount.deleted',
      object: discount
    });

    const deleted = {
      deleted: true,
      id: discount.id
    };

    context.send(200, deleted);
    next();
  };

  self.deleteSubscriptionDiscount = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    const subscription = stripe.store.getSubscription(context.identity, req.params.subscription);
    if (!subscription) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such subscription ${ req.params.subscription }`,
        param: 'subscription',
        context: context
      });
    }

    let discount = stripe.store.findDiscounts(context.identity, {
      subscription: subscription.id
    });
    if (!discount.length) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no discount subscription ${ req.params.subscription }`,
        param: 'subscription',
        context: context
      });
    }
    discount = discount[0];

    discount = stripe.store.deleteDiscount(context.identity, discount.id);
    stripe.model.event({
      context: context,
      type: 'customer.discount.deleted',
      object: discount
    });

    const deleted = {
      deleted: true,
      id: discount.id
    };

    context.send(200, deleted);
    next();
  };

  ////////////////////

  stripe.server.del('/v1/customers/:customer/discount', stripe.auth.requireAdmin, self.deleteCustomerDiscount);
  stripe.server.del('/v1/subscriptions/:subscription/discount', stripe.auth.requireAdmin, self.deleteSubscriptionDiscount);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Discounts(stripe);
};
