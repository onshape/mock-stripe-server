'use strict';

function Invoices(stripe) {
  const self = this;

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

    return stripe.errors.invalidRequestError({
      statusCode: 404,
      message: `Error: No upcoming invoices for customer: ${ customerId }`,
      req: req,
      res: res,
      next: next
    });
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
    for (const invoice of invoices) {
      for (const lineItem of invoice.lines.data) {
        if (lineItem.plan) {
          lineItem.plan = stripe.store.getPlan(req.authorization.identity, lineItem.plan);
        }
      }
    }

    const results = stripe.model.list({
      items: invoices,
      url: '/v1/invoices'
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
