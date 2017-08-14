'use strict';

function InvoiceItems(stripe) {
  const self = this;

  self.createInvoiceItem = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const customer = stripe.store.getCustomer(context.identity, req.body.customer);
    if (!customer) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such customer: ${ req.body.customer }`,
        param: 'customer',
        context: context
      });
    }

    if (!req.body.amount) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no amount provided',
        param: 'amount',
        context: context
      });
    }

    const invoiceItem = stripe.model.invoiceItem({
      context: context,
      customer: customer.id,
      amount: Number(req.body.amount),
      currency: req.body.currency,
      description: req.body.description,
      invoice: req.body.invoice,
      metadata: req.body.metadata
    });

    context.send(200, invoiceItem);
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
