'use strict';

describe('Basic Spec', function() {
  describe('Token Test', function() {
    it('Create a token', function() {
      return stripe.tokens.create({
        card: stripe.util.getDefaultCreditCard()
      });
    });
  });
});
