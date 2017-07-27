'use strict';

function Model(stripe) {
  const self = this;

  self.list = function({
    items = [], url
  }) {
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
    card, type, metadata
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

    return model;
  };

  self.token = function({
    card, clientIp
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

    return model;
  };

  self.plan = function({
    id, amount, currency, interval, interval_count,
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

    return model;
  };

  self.coupon = function({
    id, amount_off, currency, duration, duration_in_months,
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

    return model;
  };

  self.customer = function({
    card, description, email, metadata, shipping
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
    customer, plan, metadata, quantity
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
      current_period_end: 1521039614,
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

    return model;
  };

  return self;
}

module.exports = function(stripe) {
  return new Model(stripe);
};
