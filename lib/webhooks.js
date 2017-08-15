'use strict';

const crypto = require('crypto');
const request = require('request');

function Webhooks(stripe) {
  const self = this;

  self.computeSignature = function(payload, secret) {
    return crypto.createHmac('sha256', secret).
      update(payload).
      digest('hex');
  };

  self.sendWebhooks = function({
    context, event
  }) {
    const webhooks = stripe.store.getWebhooks(context.identity);

    for (const webhook of webhooks) {
      let match = false;
      for (const type of webhook.events) {
        if (type === event.type || type === '*' ||
            (type.endsWith('*') && event.type.startsWith(type.replace('*', '')))) {
          match = true;
          break;
        }
      }

      if (match) {
        const timestamp = stripe.util.timestamp();
        const payload = JSON.stringify(event);
        const signature = self.computeSignature(`${ timestamp }.${ payload }`,
          webhook.sharedSecret);

        request({
          body: event,
          headers: {
            'Stripe-Signature': `t=${ timestamp }, v1=${ signature }`
          },
          json: true,
          method: 'POST',
          url: webhook.url
        }, function(error, response) {
          if (!stripe.options.silent) {
            console.log('%s [%s/%s]: %s', stripe.util.colorize('blue', 'WEBHOOK'), response.statusCode, event.type, error);
          }
        });
      }
    }
  };

  return self;
}

module.exports = function(stripe) {
  return new Webhooks(stripe);
};
