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

  self.createProration = function({
    identity, item, customer, subscription
  }) {
    const percent = stripe.util.calculateProrationPercent(subscription.current_period_start,
      subscription.current_period_end);

    if (item.deleted) {
      stripe.model.invoiceItem({
        identity: identity,
        amount: -1 * (( item.plan.amount * item.subscriptionItem.quantity) * (percent / 100)),
        customer: customer.id,
        subscription: subscription,
        start: subscription.current_period_start,
        end: subscription.current_period_end,
        description: `Unused time on ${ item.subscriptionItem.quantity } x ${ item.plan.name }`,
        proration: true
      });
    } else {
      stripe.model.invoiceItem({
        identity: identity,
        amount: -1 * (( item.plan.amount * item.subscriptionItem.quantity) * (percent / 100)),
        customer: customer.id,
        subscription: subscription,
        start: subscription.current_period_start,
        end: subscription.current_period_end,
        description: `Unused time on ${ item.subscriptionItem.quantity } x ${ item.plan.name }`,
        proration: true
      });

      stripe.model.invoiceItem({
        identity: identity,
        amount: (( item.plan.amount * item.quantity) * (percent / 100)),
        customer: customer.id,
        subscription: subscription,
        start: subscription.current_period_start,
        end: subscription.current_period_end,
        description: `Remaining time on ${ item.quantity } x ${ item.plan.name }`,
        proration: true
      });
    }
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
      upcoming: true,
      pay: true
    });

    const response = self.populateInvoice(req.authorization.identity, invoice);
    res.send(200, response);
    next();
  };

  self.createInvoice = function(req, res, next) {
    const customerId = req.params.customer || req.body.customer;

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

    let subscription;
    if (req.body.subscription) {
      subscription = stripe.store.getSubscription(req.authorization.identity, req.body.subscription);
      if (!subscription) {
        return stripe.errors.invalidRequestError({
          statusCode: 400,
          message: `Error: no such subscription: ${ req.body.subscription }`,
          param: 'subscription',
          req: req,
          res: res,
          next: next
        });
      }
    }

    const invoiceItems = stripe.store.findInvoiceItems(req.authorization.identity, {
      customer: customer.id,
      invoice: null
    });

    if (!invoiceItems.length) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no pending invoice items',
        param: 'customer',
        req: req,
        res: res,
        next: next
      });
    }

    const invoice = stripe.model.invoice({
      identity: req.authorization.identity,
      customer: customer,
      application_fee: req.body.application_fee || null,
      description: req.body.description || null,
      statement_description: req.body.statement_descriptor || null,
      subscription: subscription,
      tax_percent: req.body.tax_percent || null,
      pay: false
    });

    const response = self.populateInvoice(req.authorization.identity, invoice);
    res.send(200, response);
    next();
  };

  self.retrieveInvoice = function(req, res, next) {
    const invoiceId = req.params.invoice;
    if (!invoiceId) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no invoice specified',
        param: 'invoice',
        req: req,
        res: res,
        next: next
      });
    }

    const invoice = stripe.store.getInvoice(req.authorization.identity, invoiceId);
    if (!invoice) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such invoice: ${ invoiceId }`,
        param: 'invoice',
        req: req,
        res: res,
        next: next
      });
    }

    const response = self.populateInvoice(req.authorization.identity, invoice);
    res.send(200, response);
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

  self.payInvoice = function(req, res, next) {
    const invoiceId = req.params.invoice;
    if (!invoiceId) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: 'Error: no invoice specified',
        param: 'invoice',
        req: req,
        res: res,
        next: next
      });
    }

    const invoice = stripe.store.getInvoice(req.authorization.identity, invoiceId);
    if (!invoice) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such invoice: ${ invoiceId }`,
        param: 'invoice',
        req: req,
        res: res,
        next: next
      });
    }

    if (!invoice.paid) {
      const customer = stripe.store.getCustomer(req.authorization.identity, invoice.customer);

      if (invoice.total > 0) {
        const charge = stripe.model.charge({
          identity: req.authorization.identity,
          customer: customer,
          invoice: invoice.id,
          amount: invoice.total
        });

        invoice.charge = charge.id;
        invoice.closed = charge.paid;
        invoice.paid = charge.paid;
      } else {
        stripe.store.updateCustomer(req.authorization.identity, customer.id, {
          account_balance: invoice.total
        });
        invoice.ending_balance = invoice.total;
        invoice.closed = true;
        invoice.paid = true;
      }
      stripe.store.updateInvoice(req.authorization.identity, invoice.id, invoice);
    }

    const response = self.populateInvoice(req.authorization.identity, invoice);
    res.send(200, response);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/invoices/upcoming', stripe.auth.requireAdmin, self.retrieveUpcomingInvoice);
  stripe.server.post('/v1/invoices', stripe.auth.requireAdmin, self.createInvoice);
  stripe.server.get('/v1/invoices/:invoice', stripe.auth.requireAdmin, self.retrieveInvoice);
  stripe.server.post('/v1/invoices/:invoice/pay', stripe.auth.requireAdmin, self.payInvoice);
  stripe.server.get('/v1/invoices', stripe.auth.requireAdmin, self.listAllInvoices);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Invoices(stripe);
};
