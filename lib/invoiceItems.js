'use strict';

function InvoiceItems(stripe) {
  const self = this;

  self.createInvoiceItem = function(req, res, next) {
    const customer = stripe.store.getCustomer(req.authorization.identity, req.body.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer: ${ req.body.customer }`,
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }

    if (!req.body.amount) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no amount provided',
        param: 'amount',
        req: req,
        res: res,
        next: next
      });
    }

    const invoiceItem = stripe.model.invoiceItem({
      identity: req.authorization.identity,
      customer: customer.id,
      amount: Number(req.body.amount),
      currency: req.body.currency,
      description: req.body.description,
      invoice: req.body.invoice,
      metadata: req.body.metadata
    });

    console.log();console.log();console.log();console.log();
    console.json(invoiceItem);
    console.log();console.log();console.log();console.log();

    res.send(200, invoiceItem);
    next();
  };

  ////////////////////

  stripe.server.post('/v1/invoiceitems', stripe.auth.requireAdmin, self.createInvoiceItem);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new InvoiceItems(stripe);
};
