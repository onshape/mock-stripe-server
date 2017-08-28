'use strict';

const restify = require('restify');

function UI(stripe) {
  const self = this;

  ////////////////////

  self.listResponse = function(title, fields, list) {
    const headers = fields.map(function(item) {
      return {
        text: stripe.util.ucFirst(item),
        value: item
      };
    });

    const response = {
      title: title,
      headers: headers,
      items: list
    };

    return response;
  };

  ////////////////////

  stripe.server.get('/ui/orgs', function(req, res, next) {
    const response = [ 'default', ...Object.keys(stripe.store.getKeys()) ];
    res.send(200, response);
    next();
  });

  stripe.server.get('/ui/organizations', function(req, res, next) {
    const keys = stripe.store.getKeys();
    const keyList = Object.keys(keys).map(function(item) {
      return Object.assign({
        id: item
      }, keys[item]);
    });

    const list = [ {
      id: 'default',
      secretKey: 'sk_test_*',
      publishableKey: 'pk_test_*'
    }, ...keyList ];

    res.send(200, self.listResponse('Organizations',
      [ 'id', 'secretKey', 'publishableKey' ],
      list));
    next();
  });

  stripe.server.get('/ui/plans/:organization', function(req, res, next) {
    const fields = [ 'id', 'name', 'amount', 'interval', 'created' ];
    const items = stripe.store.getPlans(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Plans', fields, items));
    next();
  });

  stripe.server.get('/ui/coupons/:organization', function(req, res, next) {
    const fields = [ 'id', 'amount_off', 'percent_off', 'duration', 'created' ];
    const items = stripe.store.getCoupons(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Coupons', fields, items));
    next();
  });

  stripe.server.get('/ui/tokens/:organization', function(req, res, next) {
    const fields = [ 'id', 'card', 'used', 'created' ];
    const items = stripe.store.getTokens(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Tokens', fields, items));
    next();
  });

  stripe.server.get('/ui/cards/:organization', function(req, res, next) {
    const fields = [ 'id', 'customer', 'last4', 'brand' ];
    const items = stripe.store.getCards(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Cards', fields, items));
    next();
  });

  stripe.server.get('/ui/cards/:organization', function(req, res, next) {
    const fields = [ 'id', 'customer', 'last4', 'brand' ];
    const items = stripe.store.getCards(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Cards', fields, items));
    next();
  });

  stripe.server.get('/ui/customers/:organization', function(req, res, next) {
    const fields = [ 'id', 'description', 'account_balance', 'email', 'created' ];
    const items = stripe.store.getCustomers(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Customers', fields, items));
    next();
  });

  stripe.server.get('/ui/subscriptions/:organization', function(req, res, next) {
    const fields = [ 'id', 'customer', 'plan', 'quantity', 'current_period_start',
      'current_period_end', 'created' ];
    const items = stripe.store.getSubscriptions(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Subscriptions', fields, items));
    next();
  });

  stripe.server.get('/ui/invoices/:organization', function(req, res, next) {
    const fields = [ 'id', 'customer', 'subscription',
      'charge', 'total', 'paid', 'date' ];
    const items = stripe.store.getInvoices(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Invoices', fields, items));
    next();
  });

  stripe.server.get('/ui/charges/:organization', function(req, res, next) {
    const fields = [ 'id', 'customer', 'invoice', 'source', 'amount', 'paid', 'created' ];
    const items = stripe.store.getCharges(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Charges', fields, items));
    next();
  });

  stripe.server.get('/ui/events/:organization', function(req, res, next) {
    const fields = [ 'id', 'type', 'created' ];
    const items = stripe.store.getEvents(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Events', fields, items));
    next();
  });

  stripe.server.get('/ui/webhooks/:organization', function(req, res, next) {
    const fields = [ 'id', 'url', 'events', 'sharedSecret', 'created' ];
    const items = stripe.store.getWebhooks(req.params.organization).map(function(value) {
      const item = {};
      fields.forEach(function(field) {
        item[field] = value[field];
      });
      return item;
    });

    res.send(200, self.listResponse('Webhooks', fields, items));
    next();
  });

  stripe.server.get('/ui/requests', function(req, res, next) {
    const requests = stripe.store.getRequests();
    const requestList = Object.keys(requests).map(function(item) {
      item = requests[item];
      return {
        id: item.id,
        timestamp: item.timestamp,
        method: item.method,
        url: item.url,
        statusCode: item.statusCode
      };
    });

    requestList.sortByCreated();

    res.send(200, self.listResponse('Requests',
      [ 'id', 'timestamp', 'method', 'url', 'statusCode' ],
      requestList));
    next();
  });

  stripe.server.get('/ui/:type/:organization/:id', function(req, res, next) {
    let item = {};
    switch (req.params.type) {
      case 'plan':
        item = stripe.store.getPlan(req.params.organization, req.params.id);
        break;
      case 'coupon':
        item = stripe.store.getCoupon(req.params.organization, req.params.id);
        break;
      case 'token':
        item = stripe.store.getToken(req.params.organization, req.params.id);
        break;
      case 'card':
        item = stripe.store.getCard(req.params.organization, req.params.id);
        break;
      case 'customer':
        item = stripe.store.getCustomer(req.params.organization, req.params.id);
        break;
      case 'subscription':
        item = stripe.store.getSubscription(req.params.organization, req.params.id);
        break;
      case 'invoice':
        item = stripe.store.getInvoice(req.params.organization, req.params.id);
        break;
      case 'charge':
        item = stripe.store.getCharge(req.params.organization, req.params.id);
        break;
      case 'event':
        item = stripe.store.getEvent(req.params.organization, req.params.id);
        break;
      case 'webhook':
        item = stripe.store.getWebhook(req.params.organization, req.params.id);
        break;
      case 'request':
        item = stripe.store.getRequests()[req.params.id];
        break;
    }

    res.send(200, item);
    next();
  });

  ////////////////////

  stripe.server.get('/', restify.plugins.serveStatic({
    directory: './ui',
    file: 'index.html'
  }));

  stripe.server.get(/\/[^/]+\.(html|js|css|svg|ico|png)$/, restify.plugins.serveStatic({
    directory: './ui',
    default: 'index.html'
  }));

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new UI(stripe);
};
