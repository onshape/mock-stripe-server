'use strict';

function Model(stripe) {
  const self = this;

  self.list = function({
    items = [], url
  }) {

    if (!Array.isArray(items)) {
      items = [ items ];
    }

    const model = {
      object: 'list',
      data: items,
      has_more: false,
      total_count: items.length,
      url: url
    };

    return model;
  };

  self.card = function({
    identity, card, type, metadata
  }) {
    const model = {
      id: 'card_' + stripe.util.generateUniqueId(24),
      object: 'card',
      address_city: card.address_city || null,
      address_country: card.address_country || null,
      address_line1: card.address_line1 || null,
      address_line1_check: (card.address_line1) ? 'unchecked' : null,
      address_line2: card.address_line2 || null,
      address_state: card.address_state || null,
      address_zip: card.address_zip || null,
      address_zip_check: (card.address_zip) ? 'unchecked' : null,
      brand: type.brand,
      country: type.country,
      cvc_check: 'unchecked',
      dynamic_last4: null,
      exp_month: Number(card.exp_month),
      exp_year: Number(card.exp_year),
      fingerprint: stripe.util.generateUniqueId(16),
      funding: type.funding,
      last4: card.number.replace(/^(.*)(\d\d\d\d)$/g, '$2'),
      metadata: metadata || {},
      name: card.name || null,
      tokenization_method: null
    };

    if (identity) {
      stripe.store.addCard(identity, model.id, model);
    }

    return model;
  };

  self.token = function({
    identity, card, clientIp
  }) {
    const model = {
      id: 'tok_' + stripe.util.generateUniqueId(24),
      object: 'token',
      card: card,
      client_ip: clientIp,
      created: stripe.util.timestamp(),
      livemode: false,
      type: 'card',
      used: false
    };

    if (identity) {
      stripe.store.addToken(identity, model.id, model);
    }

    return model;
  };

  self.plan = function({
    identity, id, amount, currency, interval, interval_count,
    metadata, name, statement_descriptor, trial_period_days
  }) {
    const model = {
      id: id,
      object: 'plan',
      amount: Number(amount) || 0,
      created: stripe.util.timestamp(),
      currency: currency,
      interval: interval,
      interval_count: Number(interval_count) || 1,
      livemode: false,
      metadata: metadata || {},
      name: name,
      statement_descriptor: statement_descriptor || null,
      trial_period_days: Number(trial_period_days) || null
    };

    if (identity) {
      stripe.store.addPlan(identity, model.id, model);
    }

    return model;
  };

  self.coupon = function({
    identity, id, amount_off, currency, duration, duration_in_months,
    max_redemptions, metadata, percent_off, redeem_by
  }) {
    const model = {
      id: id || 'cou_' + stripe.util.generateUniqueId(24),
      object: 'coupon',
      amount_off: Number(amount_off) || null,
      created: stripe.util.timestamp(),
      currency: currency || null,
      duration: duration,
      duration_in_months: Number(duration_in_months) || null,
      livemode: false,
      max_redemptions: Number(max_redemptions) || null,
      metadata: metadata || {},
      percent_off: Number(percent_off) || null,
      redeem_by: Number(redeem_by) || null,
      times_redeemed: 0,
      valid: true
    };

    if (identity) {
      stripe.store.addCoupon(identity, model.id, model);
    }

    return model;
  };

  self.customer = function({
    identity, card, description, email, metadata, shipping
  }) {
    const model = {
      id: 'cus_' + stripe.util.generateUniqueId(24),
      object: 'customer',
      account_balance: 0,
      created: stripe.util.timestamp(),
      currency: 'usd',
      default_source: (card) ? card.id : null,
      delinquent: false,
      description: description || null,
      discount: null,
      email: email || null,
      livemode: false,
      metadata: metadata || {},
      shipping: shipping || null
    };

    if (identity) {
      stripe.store.addCustomer(identity, model.id, model);
    }

    return model;
  };

  self.subscriptionItem = function({
    plan, subscription, quantity, metadata
  }) {
    const model = {
      id: 'si_' + stripe.util.generateUniqueId(24),
      object: 'subscription_item',
      created: stripe.util.timestamp(),
      metadata: metadata || {},
      plan: plan.id,
      quantity: Number(quantity) || 1
    };

    subscription.items.data.push(model);
    subscription.items.total_count = subscription.items.data.length;

    return model;
  };

  self.subscription = function({
    identity, customer, plan, metadata, quantity
  }) {
    const id = 'sub_' + stripe.util.generateUniqueId(24);
    const timestamp = stripe.util.timestamp();

    const model = {
      id: id,
      object: 'subscription',
      application_fee_percent: null,
      cancel_at_period_end: false,
      canceled_at: null,
      created: timestamp,
      current_period_end: timestamp + stripe.data.plans.intervals[plan.interval],
      current_period_start: timestamp,
      customer: customer.id,
      discount: null,
      ended_at: null,
      items: self.list({
        url: `/v1/subscription_items?subscription=${ id }`
      }),
      livemode: false,
      metadata: metadata || {},
      plan: plan.id,
      quantity: quantity || 1,
      start: timestamp,
      status: 'active',
      tax_percent: null,
      trial_end: null,
      trial_start: null
    };

    self.subscriptionItem({
      subscription: model,
      plan: plan,
      quantity: quantity
    });

    if (identity) {
      stripe.store.addSubscription(identity, model.id, model);
    }

    return model;
  };

  self.invoiceLineItem = function({
    amount, currency, description, metadata, subscription
  }) {
    const timestamp = stripe.util.timestamp();

    const model = {
      id: 'ii_' + stripe.util.generateUniqueId(24),
      object: 'line_item',
      amount: amount || 0,
      currency: currency || 'usd',
      description: description || null,
      discountable: true,
      livemode: false,
      metadata: metadata || {},
      period: {
        start: (subscription) ? subscription.current_period_start : timestamp,
        end: (subscription) ? subscription.current_period_end : timestamp
      },
      plan: (subscription) ? subscription.plan : null,
      proration: false,
      quantity: (subscription) ? subscription.quantity : null,
      subscription: (subscription) ? subscription.id : null,
      subscription_item: (subscription) ? subscription.items.data[0].id : null,
      type: (subscription) ? 'subscription' : 'invoiceitem'
    };

    return model;
  };

  self.invoice = function({
    identity, customer, application_fee, description, metadata,
    statement_descriptor, subscription, tax_percent
  }) {
    const id = 'in' + stripe.util.generateUniqueId(24);
    let model;

    if (subscription) {
      const plan = stripe.store.getPlan(identity, subscription.plan);

      const lineItem = self.invoiceLineItem({
        subscription: subscription,
        amount: plan.amount * subscription.quantity
      });

      const charge = self.charge({
        identity: identity,
        customer: customer,
        invoice: id,
        amount: lineItem.amount
      });

      model = {
        id: id,
        object: 'invoice',
        amount_due: lineItem.amount,
        application_fee: application_fee || null,
        attempt_count: 1,
        attempted: true,
        charge: charge.id,
        closed: true,
        currency: 'usd',
        customer: customer.id,
        date: stripe.util.timestamp(),
        description: description || null,
        discount: null,
        ending_balance: 0,
        forgiven: false,
        lines: self.list({
          items: lineItem,
          url: `/v1/invoices/${ id }/lines`
        }),
        livemode: false,
        metadata: metadata || {},
        next_payment_attempt: null,
        paid: true,
        period_end: subscription.current_period_end,
        period_start: subscription.current_period_start,
        receipt_number: null,
        starting_balance: 0,
        statement_descriptor: statement_descriptor || null,
        subscription: subscription.id || null,
        subtotal: lineItem.amount,
        tax: null,
        tax_percent: tax_percent || null,
        total: lineItem.amount,
        webhooks_delivered_at: null
      };

      if (identity) {
        stripe.store.addInvoice(identity, model.id, model);
      }

      return model;
    } else {
      return null;
    }
  };

  self.charge = function({
    identity, amount, currency, source, customer, invoice, description
  }) {
    const id = 'ch_' + stripe.util.generateUniqueId(24);

    let card;
    if (customer) {
      card = customer.default_source;
    } else {
      const token = stripe.store.getToken(identity, source);
      card = token.card;
    }

    const model = {
      id: id,
      object: 'charge',
      amount: amount,
      amount_refunded: 0,
      application: null,
      application_fee: null,
      balance_transaction: 'txn_' + stripe.util.generateUniqueId(24),
      captured: true,
      created: stripe.util.timestamp(),
      currency: currency || 'usd',
      customer: (customer) ? customer.id : null,
      description: description || null,
      destination: null,
      dispute: null,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: (invoice) ? invoice.id : null,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      order: null,
      outcome: {
        network_status: 'approved_by_network',
        reason: null,
        risk_level: 'normal',
        seller_message: 'Payment complete.',
        type: 'authorized'
      },
      paid: true,
      receipt_email: null,
      receipt_number: null,
      refunded: false,
      refunds: self.list({
        url: `/v1/charges/${ id }/refunds`
      }),
      review: null,
      shipping: null,
      source: card,
      source_transfer: null,
      statement_descriptor: null,
      status: 'succeeded',
      transfer_group: null
    };

    if (identity) {
      stripe.store.addCharge(identity, model.id, model);
    }

    return model;
  };

  return self;
}

module.exports = function(stripe) {
  return new Model(stripe);
};
