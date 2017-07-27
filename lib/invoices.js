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

  ////////////////////

  stripe.server.get('/v1/invoices/upcoming', stripe.auth.requireAdmin, self.retrieveUpcomingInvoice);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Invoices(stripe);
};
