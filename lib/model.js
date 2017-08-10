'use strict';

function Model(stripe) {
  const self = this;

  self.context = function({
    request, response
  }) {
    const model = {
      identity: request.authorization.identity,
      requestId: request.requestId,
      timestamp: stripe.util.timestamp(),
      livemode: stripe.livemode,
      send: function(code, object) {
        console.json(object);
        response.send(code, object);
      }
    };

    return model;
  };

  self.list = function({
    items = [], url, paginate, query
  }) {

    if (!Array.isArray(items)) {
      items = [ items ];
    }

    let has_more = false;

    if (paginate) {
      const limit = Number(query.limit) || 10;
      items = items.slice().sortByCreated();

      if (query.starting_after) {
        let starting_index = null;
        for (let s = 0; s < items.length; s++) {
          if (items[s].id === query.starting_after) {
            starting_index = s;
            break;
          }
        }
        if (starting_index !== null) {
          items = items.slice(starting_index + 1, items.length);
        }
      }

      if (query.ending_before) {
        let ending_index = null;
        for (let e = 0; e < items.length; e++) {
          if (items[e].id === query.ending_before) {
            ending_index = e;
            break;
          }
        }
        if (ending_index !== null) {
          items = items.slice(0, ending_index);
        }
      }

      items = items.filter(function(item) {
        // Remove canceled items by default
        if (item.status === 'canceled' &&
            query.status !== 'canceled') {
          return false;
        }

        if (query.created) {
          if (typeof query.created === 'string') {
            return item.created === Number(query.created);
          } else if (query.created.gt) {
            return item.created > Number(query.created.gt);
          } else if (query.created.gte) {
            return item.created >= Number(query.created.gte);
          } else if (query.created.lt) {
            return item.created < Number(query.created.lt);
          } else if (query.created.lte) {
            return item.created <= Number(query.created.lte);
          }
        }

        return true;
      });

      if (items.length > limit) {
        has_more = true;
        items = items.slice(0, limit);
      }
    }

    const model = {
      object: 'list',
      data: items,
      has_more: has_more,
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
      tokenization_method: null,
      create: stripe.util.timestamp()
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
    plan, quantity, metadata
  }) {
    const model = {
      id: 'si_' + stripe.util.generateUniqueId(24),
      object: 'subscription_item',
      created: stripe.util.timestamp(),
      metadata: metadata || {},
      plan: plan.id,
      quantity: Number(quantity) || 1
    };

    return model;
  };

  self.subscription = function({
    identity, customer, items, metadata, coupon, application_fee_percent,
    tax_percent, trial_end, trial_period_days
  }) {
    const id = 'sub_' + stripe.util.generateUniqueId(24);
    const timestamp = stripe.util.timestamp();

    let discount;
    if (coupon) {
      discount = self.discount({
        identity: identity,
        customer: customer.id,
        subscription: id,
        coupon: coupon
      });
    }

    let plan;
    let quantity;
    const subscriptionItems = [];
    for (const item of items) {
      const subscriptionItem = self.subscriptionItem({
        plan: item.plan,
        quantity: item.quantity
      });
      plan = item.plan;
      quantity = subscriptionItem.quantity;

      subscriptionItems.push(subscriptionItem);
    }

    let trial_start = null;
    trial_end = null;

    const trial_period = trial_period_days || plan.trial_period_days;
    if (trial_end) {
      trial_start = timestamp;
      if (trial_end === 'now') {
        trial_end = timestamp;
      }
    }

    if (trial_period) {
      trial_start = timestamp;
      trial_end = timestamp + (stripe.data.trial.duration.day * trial_period);
    }

    const model = {
      id: id,
      object: 'subscription',
      application_fee_percent: application_fee_percent || null,
      cancel_at_period_end: false,
      canceled_at: null,
      created: timestamp,
      current_period_end: timestamp + stripe.data.plans.intervals[plan.interval],
      current_period_start: timestamp,
      customer: customer.id,
      discount: discount || null,
      ended_at: null,
      items: self.list({
        items: subscriptionItems,
        url: `/v1/subscription_items?subscription=${ id }`
      }),
      livemode: false,
      metadata: metadata || {},
      plan: plan.id,
      quantity: quantity || 1,
      start: timestamp,
      status: 'active',
      tax_percent: tax_percent || null,
      trial_end: trial_end || null,
      trial_start: trial_start || null
    };

    if (identity) {
      stripe.store.addSubscription(identity, model.id, model);
    }

    return model;
  };

  self.invoiceLineItem = function({
    amount, currency, description, metadata, subscription, coupon, upcoming,
    proration
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
      proration: stripe.util.toBoolean(proration),
      quantity: (subscription) ? subscription.quantity : 1,
      subscription: (subscription) ? subscription.id : null,
      subscription_item: (subscription) ? subscription.items.data[0].id : null,
      type: (subscription) ? 'subscription' : 'invoiceitem'
    };

    if (coupon) {
      if (coupon.amount_off) {
        model.amount -= coupon.amount_off;
      } else if (coupon.percent_off) {
        model.amount -= Math.ceil(model.amount * (coupon.percent_off / 100));
      }
    }

    if (upcoming) {
      const diff = model.period.end - model.period.start;
      model.period.start = model.period.end;
      model.period.end += diff;
    }

    return model;
  };

  self.invoiceItem = function({
    identity, customer, amount, currency, description,
    invoice, metadata, subscription, proration,
    start, end
  }) {
    const timestamp = stripe.util.timestamp();

    const model = {
      id: 'ii_' + stripe.util.generateUniqueId(24),
      object: 'invoiceitem',
      amount: Number(amount),
      currency: currency || 'usd',
      customer: customer,
      date: timestamp,
      description: description || null,
      discountable: true,
      invoice: invoice || null,
      livemode: false,
      metadata: metadata || {},
      period: {
        start: start || timestamp,
        end: end || timestamp
      },
      plan: (subscription) ? subscription.plan : null,
      proration: stripe.util.toBoolean(proration),
      quantity: (subscription) ? subscription.quantity : 1,
      subscription: (subscription) ? subscription.id : null
    };

    if (identity) {
      stripe.store.addInvoiceItem(identity, model.id, model);
    }

    return model;
  };

  self.invoice = function({
    identity, customer, application_fee, description, metadata,
    statement_descriptor, subscription, tax_percent, upcoming,
    pay
  }) {
    const id = 'in_' + stripe.util.generateUniqueId(24);
    const timestamp = stripe.util.timestamp();
    const items = [];

    let discount = null;

    let start = timestamp;
    let end = 0;

    let subtotal = 0;
    let total = 0;
    let tax = null;

    const starting_balance = customer.account_balance;
    let ending_balance = 0;

    if (subscription) {
      let coupon;
      if (subscription.discount) {
        discount = subscription.discount;
        coupon = stripe.store.getCoupon(identity, subscription.discount.coupon);
      }

      for (const item of subscription.items.data) {
        const plan = stripe.store.getPlan(identity, item.plan);

        const lineItem = self.invoiceLineItem({
          subscription: subscription,
          amount: plan.amount * subscription.quantity,
          coupon: coupon,
          description: item.description || null,
          upcoming: upcoming
        });
        items.push(lineItem);

        subtotal += lineItem.amount;
        start = lineItem.period.start;
        end = lineItem.period.end;
      }
    } else {
      const invoiceItems = stripe.store.findInvoiceItems(identity, {
        customer: customer.id,
        invoice: null
      });

      for (const item of invoiceItems) {
        const lineItem = self.invoiceLineItem({
          amount: item.amount,
          description: item.description || null,
          upcoming: upcoming
        });
        items.push(lineItem);

        subtotal += lineItem.amount;
        start = lineItem.period.start;
        end = lineItem.period.end;

        if (!upcoming) {
          item.invoice = id;
          stripe.store.updateInvoiceItem(identity, item.id, item);
        }
      }
    }

    if (tax_percent) {
      tax = subtotal * (tax_percent / 100);
      total = subtotal + tax;
    } else {
      total = subtotal;
    }

    total += starting_balance;

    let charge;
    if (pay) {
      if (total > 0) {
        charge = self.charge({
          identity: identity,
          customer: customer,
          invoice: id,
          amount: total,
          upcoming: upcoming
        });

        stripe.store.updateCustomer(identity, customer.id, {
          account_balance: 0
        });
      } else {
        charge = {
          id: null,
          closed: true,
          paid: true
        };

        stripe.store.updateCustomer(identity, customer.id, {
          account_balance: total
        });
        ending_balance = total;
      }
    }

    const model = {
      id: id,
      object: 'invoice',
      amount_due: total,
      application_fee: application_fee || null,
      attempt_count: (charge) ? 1 : 0,
      attempted: (pay && !upcoming) ? true : false,
      charge: (charge) ? charge.id : null,
      closed: (charge && charge.paid) ? true : false,
      currency: 'usd',
      customer: customer.id,
      date: timestamp,
      description: description || null,
      discount: discount,
      ending_balance: ending_balance,
      forgiven: false,
      lines: self.list({
        items: items,
        url: `/v1/invoices/${ id }/lines`
      }),
      livemode: false,
      metadata: metadata || {},
      next_payment_attempt: null,
      paid: (charge) ? charge.paid : false,
      period_end: end,
      period_start: start,
      receipt_number: null,
      starting_balance: starting_balance,
      statement_descriptor: statement_descriptor || null,
      subscription: (subscription) ? subscription.id : null,
      subtotal: subtotal,
      tax: tax,
      tax_percent: tax_percent || null,
      total: total,
      webhooks_delivered_at: null
    };

    if (upcoming) {
      const diff = model.period_end - model.period_start;
      model.period_start = model.period_end;
      model.period_end = model.period_end + diff;
    }

    if (identity && !upcoming) {
      stripe.store.addInvoice(identity, model.id, model);
    }

    return model;
  };

  self.charge = function({
    identity, amount, currency, source, customer, invoice, description, upcoming
  }) {
    const id = 'ch_' + stripe.util.generateUniqueId(24);

    let card;
    if (customer) {
      card = customer.default_source;
    }
    if (source) {
      const token = stripe.store.getToken(identity, source);
      card = token.card;
    }

    if (card.id) {
      card = card.id;
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
      paid: (upcoming) ? false : true,
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
      status: (upcoming) ? 'pending' : 'succeeded',
      transfer_group: null
    };

    if (identity) {
      stripe.store.addCharge(identity, model.id, model);
    }

    return model;
  };

  self.discount = function({
    identity, coupon, customer, subscription
  }) {
    if (coupon.times_redeemed === coupon.max_redemptions) {
      return null;
    }

    coupon.times_redeemed++;

    const model = {
      object: 'discount',
      coupon: coupon.id,
      customer: customer,
      end: null,
      start: stripe.util.timestamp(),
      subscription: subscription
    };

    if (coupon.duration === 'repeating') {
      model.end = model.start + (coupon.duration_in_months * stripe.data.coupons.duration.month);
    }

    if (identity) {
      stripe.store.addDiscount(identity, model.customer, model); // indexed by customer id
      stripe.store.updateCoupon(identity, coupon.id, coupon);
    }

    return model;
  };

  self.event = function({
    identity, object, req, type
  }) {
    const model = {
      id: 'evt_' + stripe.util.generateUniqueId(24),
      object: 'event',
      api_version: stripe.apiVersion,
      created: stripe.util.timestamp(),
      data: {
        object: object
      },
      livemode: false,
      pending_webhooks: 0,
      request: {
        id: req.requestId,
        idempotency_key: null
      },
      type: type
    };

    if (identity) {
      stripe.store.addEvent(identity, model.id, model);
    }

    return model;
  };

  self.webhook = function({
    identity, url, sharedSecret
  }) {
    const model = {
      id: 'wh_' + stripe.util.generateUniqueId(24),
      created: stripe.util.timestamp(),
      url: url,
      sharedSecret: sharedSecret
    };

    if (identity) {
      stripe.store.addWebhook(identity, model.id, model);
    }

    return model;
  };

  return self;
}

module.exports = function(stripe) {
  return new Model(stripe);
};
