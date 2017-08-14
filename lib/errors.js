'use strict';

function Errors(stripe) {
  const self = this;

  self.sendError = function({
    type, code, param, detail, statusCode = 400, message, context
  }) {
    const response = {
      error: {
        type: type,
        code: code || null,
        param: param || null,
        message: message,
        detail: detail || null,
        statusCode: statusCode,
        decline_code: null,
        charge: null,
        requestId: context.requestId
      }
    };

    if (!stripe.options.silent) {
      console.log('%s [%s/%s]: %s', stripe.util.colorize('red', 'ERROR'), statusCode, type, message);
    }

    context.send(statusCode, response);
    context.next(false);
  };

  self.apiError = function(options) {
    options.type = 'api_error';
    return self.sendError(options);
  };

  self.authenticationError = function(options) {
    options.type = 'authentication_error';
    return self.sendError(options);
  };

  self.cardError = function(options) {
    options.type = 'card_error';
    return self.sendError(options);
  };

  self.invalidRequestError = function(options) {
    options.type = 'invalid_request_error';
    return self.sendError(options);
  };

  return self;
}

module.exports = function(stripe) {
  return new Errors(stripe);
};
