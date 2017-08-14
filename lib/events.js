'use strict';

function Events(stripe) {
  const self = this;

  self.retrieveEvent = function(req, res, next) {
    const context = stripe.model.context(req, res, next);

    const event = stripe.store.getEvent(context.identity, req.params.event);
    if (!event) {
      return stripe.errors.invalidRequestError({
        statusCode: 400,
        message: `Error: no such event ${ req.params.event }`,
        param: 'event',
        context: context
      });
    }

    context.send(200, event);
    next();
  };

  self.listAllEvents = function(req, res, next) {
    const context = stripe.model.context(req, res, next);
    const events = stripe.store.getEvents(context.identity);
    const results = stripe.model.list({
      items: events,
      url: '/v1/events',
      paginate: true,
      query: req.query
    });

    context.send(200, results);
    next();
  };

  ////////////////////

  stripe.server.get('/v1/events/:event', self.retrieveEvent);
  stripe.server.get('/v1/events', self.listAllEvents);

  ////////////////////

  return self;
}

module.exports = function(stripe) {
  return new Events(stripe);
};
