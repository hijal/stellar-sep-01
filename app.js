require('dotenv').config();

const express = require('express');

const { Transaction, Keypair } = require('stellar-sdk');
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const PORT = process.env.PORT;

function enableCors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

const app = express();

app.use(enableCors);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  '/.well-known',
  express.static('./static/well_known', {
    setHeaders: function (res, _) {
      res.set('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
      res.type('text/plain');
    }
  })
);

app.post('/sign', (req, res, next) => {
  const { transaction, network_passphrase } = req.body;

  if (!transaction || !network_passphrase) {
    throw new Error('Transaction or network passphrase is missing');
  }

  const tx = new Transaction(transaction, network_passphrase);

  if (Number.parseInt(tx.sequence, 10) !== 0) {
    throw new Error('Transaction sequence number must be 0');
  }

  tx.sign(Keypair.fromSecret(SERVER_PRIVATE_KEY));

  res.status(200).json({
    transaction: tx.toEnvelope().toXDR('base64'),
    network_passphrase: network_passphrase
  });
});

app.listen(PORT);
