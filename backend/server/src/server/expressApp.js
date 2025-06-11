const express = require('express');
const session = require('express-session');
const uuid = require('uuid');

const map = new Map(); // Exported for shared access
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

const app = express();

app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', function (req, res) {
  const id = uuid.v4();
  console.log(`Updating session for user ${id}`);
  req.session.userId = id;
  res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', function (req, res) {
  const ws = map.get(req.session.userId);

  console.log('Destroying session');
  req.session.destroy(function () {
    if (ws) ws.close();
    res.send({ result: 'OK', message: 'Session destroyed' });
  });
});

module.exports = { app, sessionParser, map };
