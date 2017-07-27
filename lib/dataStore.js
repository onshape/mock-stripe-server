'use strict';

function DataStore() {
  const self = this;

  const store = {
    keys: {},
    cards: {},
    tokens: {},
    plans: {},
    coupons: {},
    customers: {},
    subscriptions: {},
    invoices: {},
    events: {}
  };

  ////////////////////////////////////////

  self.addItem = function(container, identity, id, value) {
    if (!value && typeof id === 'object') {
      value = id;
      id = value.ud;
    }

    if (!container[identity]) {
      container[identity] = {};
    }
    container[identity][id] = value;
  };

  self.getAllItems = function(container, identity) {
    if (!container[identity]) {
      container[identity] = {};
    }
    const results = [];
    for (const id in container[identity]) {
      results.push(container[identity][id]);
    }
    return results;
  };

  self.getItem = function(container, identity, id) {
    if (!container[identity]) {
      container[identity] = {};
    }
    return container[identity][id];
  };

  self.updateItem = function(container, identity, id, value) {
    if (!container[identity]) {
      container[identity] = {};
    }
    if (container[identity][id]) {
      return Object.assign(container[identity][id], value);
    } else {
      return false;
    }
  };

  self.deleteItem = function(container, identity, id) {
    if (!container[identity]) {
      container[identity] = {};
    }
    if (container[identity][id]) {
      container[identity][id].deleted = true;
      return true;
    } else {
      return false;
    }
  };

  self.findItems = function(container, identity, query) {
    if (!container[identity]) {
      container[identity] = {};
    }

    const results = [];

    for (const itemId in container[identity]) {
      const item = container[identity][itemId];

      let match = true;

      for (const property in query) {
        if (item[property] !== query[property]) {
          match = false;
          break;
        }
      }
      if (match) {
        results.push(item);
      }
    }

    return results;
  };

  ////////////////////////////////////////

  self.addKey = (identity, key) => (store.keys[identity] = key);
  self.getKeys = () => store.keys;

  ////////////////////////////////////////

  self.addCard = (identity, id, card) => self.addItem(store.cards, identity, id, card);
  self.getCard = (identity, id) => self.getItem(store.cards, identity, id);
  self.updateCard = (identity, id, card) => self.updateItem(store.cards, identity, id, card);
  self.findCards = (identity, query) => self.findItems(store.cards, identity, query);

  self.addToken = (identity, id, token) => self.addItem(store.tokens, identity, id, token);
  self.getToken = (identity, id) => self.getItem(store.tokens, identity, id);
  self.updateToken = (identity, id, token) => self.updateItem(store.tokens, identity, id, token);

  ////////////////////////////////////////

  self.addPlan = (identity, id, plan) => self.addItem(store.plans, identity, id, plan);
  self.getPlan = (identity, id) => self.getItem(store.plans, identity, id);
  self.updatePlan = (identity, id, plan) => self.updateItem(store.plans, identity, id, plan);
  self.deletePlan = (identity, id) => self.getItem(store.plans, identity, id);
  self.getPlans = (identity) => self.getAllItems(store.plans, identity);

  ////////////////////////////////////////

  self.addCoupon = (identity, id, coupon) => self.addItem(store.coupons, identity, id, coupon);
  self.getCoupon = (identity, id) => self.getItem(store.coupons, identity, id);
  self.updateCoupon = (identity, id, coupon) => self.updateItem(store.coupons, identity, id, coupon);
  self.deleteCoupon = (identity, id) => self.getItem(store.coupons, identity, id);
  self.getCoupons = (identity) => self.getAllItems(store.coupons, identity);

  ////////////////////////////////////////

  self.addCustomer = (identity, id, customer) => self.addItem(store.customers, identity, id, customer);
  self.getCustomer = (identity, id) => self.getItem(store.customers, identity, id);
  self.updateCustomer = (identity, id, customer) => self.updateItem(store.customers, identity, id, customer);
  self.deleteCustomer = (identity, id) => self.getItem(store.customers, identity, id);
  self.getCustomers = (identity) => self.getAllItems(store.customers, identity);

  ////////////////////////////////////////

  self.addSubscription = (identity, id, subscription) =>
    self.addItem(store.subscriptions, identity, id, subscription);
  self.getSubscription = (identity, id) => self.getItem(store.subscriptions, identity, id);
  self.updateSubscription = (identity, id, subscription) =>
    self.updateItem(store.subscriptions, identity, id, subscription);
  self.deleteSubscription = (identity, id) => self.getItem(store.subscriptions, identity, id);
  self.getSubscriptions = (identity) => self.getAllItems(store.subscriptions, identity);
  self.findSubscriptions = (identity, query) => self.findItems(store.subscriptions, identity, query);

  ////////////////////////////////////////

  return self;
}

module.exports = new DataStore();
