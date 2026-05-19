const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

async function invokeApp(app, requestOptions) {
  const req = httpMocks.createRequest(requestOptions);
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  if (requestOptions.session) {
    req.session = requestOptions.session;
  }

  if (requestOptions.file) {
    req.mockFile = requestOptions.file;
  }

  res.render = (view, options) => {
    app.render(view, options, (err, html) => {
      if (err) {
        throw err;
      }

      res.send(html);
    });
  };

  await new Promise((resolve) => {
    res.on('end', resolve);
    app.handle(req, res);
  });

  return { req, res };
}

module.exports = {
  invokeApp
};
