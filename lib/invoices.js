'use strict';

function Invoices(stripe) {
  const self = this;

  self.populateInvoice = function(identity, invoice) {
    invoice = stripe.util.clone(invoice);
    for (const lineItem of invoice.lines.data) {
      if (lineItem.plan) {
        lineItem.plan = stripe.store.getPlan(identity, lineItem.plan);
      }
    }
    if (invoice.discount) {
      invoice.discount.coupon = stripe.store.getCoupon(identity, invoice.discount.coupon);
    }
    return invoice;
  };

  self.retrieveUpcomingInvoice = function(req, res, next) {
    if (!req.query.customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no customer specified',
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }

    const customerId = req.query.customer;
    const customer = stripe.store.getCustomer(req.authorization.identity, customerId);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer ${ customerId }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    const subscriptionId = req.query.subscription;
    const subscription = stripe.store.getSubscription(req.authorization.identity, subscriptionId);
    if (subscriptionId && !subscription) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such subscription ${ subscriptionId }`,
        param: 'id',
        req: req,
        res: res,
        next: next
      });
    }

    const invoices = stripe.store.findInvoices(req.authorization.identity, {
      customer: customerId,
      subscription: subscriptionId
    });

    const subscriptions = stripe.store.findSubscriptions(req.authorization.identity, {
      customer: customerId
    });

    if (!invoices.length || !subscriptions.length) {
      return stripe.errors.invalidRequestError({
        statusCode: 404,
        message: `Error: No upcoming invoices for customer: ${ customerId }`,
        req: req,
        res: res,
        next: next
      });
    }

    const invoice = stripe.model.invoice({
      identity: req.authorization.identity,
      customer: customer,
      subscription: subscription,
      upcoming: true
    });

    const response = self.populateInvoice(req.authorization.identity, invoice);
    res.send(200, response);
    next();
  };

  self.retrieveInvoice = function(req, res, next) {
    next();
  };

  self.listAllInvoices = function(req, res, next) {
    let invoices;
    if (req.query && req.query.customer) {
      invoices = stripe.store.findInvoices(req.authorization.identity, {
        customer: req.query.customer
      });
    } else {
      invoices = stripe.store.getInvoices(req.authorization.identity);
    }

    invoices = stripe.util.clone(invoices);
    invoices = invoices.map(function(invoice) {
      return self.populateInvoice(req.authorization.identity, invoice);
    });

    const results = stripe.model.list({
      items: invoices,
      url: '/v1/invoices',
      paginate: true,
      query: req.query
    });

    res.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/invoices/upcoming', stripe.auth.requireAdmin, self.retrieveUpcomingInvoice);
  stripe.server.get('/v1/invoices', stripe.auth.requireAdmin, self.listAllInvoices);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Invoices(stripe);
};
