'use strict';

describe('Basic Spec', function() {
  describe('Token Test', function() {
    it('Create a token', function() {
      return stripe.tokens.create({
        number: '4242424242424242',
        exp_month: 12,
        exp_year: new Date().getFullYear() + 2,
        cvc: '123',
        address_line1: '1 Alewife Center',
        address_line2: 'Suite 130',
        address_city: 'Cambridge',
        address_state: 'MA',
        address_zip: '02140',
        address_country: 'US'
      });
    });
  });
});
