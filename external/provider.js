require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');

const FREE_DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, './data/free_data.json'), 'utf8'));
const PREMIUM_DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, './data/premium_data.json'), 'utf8'));

const randomIndexes = [];
while (randomIndexes.length < 4) {
  const id = Math.floor(Math.random() * Math.min(FREE_DATA.length, PREMIUM_DATA.length));
  if (!randomIndexes.includes(id)) {
    randomIndexes.push(id);
  }
}
const SERVICE_ERROR_EXCEPTION_DATA = FREE_DATA[randomIndexes[0]];
const FREE_RESPONSE_EXCEPTION_DATA = FREE_DATA[randomIndexes[1]];
const PREMIUM_RESPONSE_EXCEPTION_DATA = PREMIUM_DATA[randomIndexes[2]];
const EMPTY_RESULTS_EXCEPTION = PREMIUM_DATA[randomIndexes[3]];

function unstabilizer(ratePercent) {
  const diceroll = Math.floor(Math.random() * 100);
  if (diceroll < ratePercent) {
    return true;
  }

  return false;
}

function slower(minMs = 0, maxMs = 1) {
  return new Promise((resolve) => setTimeout(resolve, minMs + Math.floor(Math.random() * (maxMs - minMs))));
}

const companyApi = express.Router();
companyApi
  .get('/free', async (req, res, next) => {
    try {
      const query = req.query.query?.toLowerCase();

      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      if (query !== FREE_RESPONSE_EXCEPTION_DATA.cin.toLowerCase()) {
        if (query ===  EMPTY_RESULTS_EXCEPTION.cin.toLowerCase()) {
          return res.status(200).json([]);
        }

        if ((query === SERVICE_ERROR_EXCEPTION_DATA.cin.toLowerCase())
          || (query === PREMIUM_RESPONSE_EXCEPTION_DATA.cin.toLowerCase())
          || unstabilizer(40)) {
          return res.status(503).json({ error: 'Service Unavailable' });
        }
      }

      await slower(100, 500);

      return res.status(200).json(FREE_DATA.filter((company) => company.cin.toLowerCase().includes(query)));
    } catch (error) {
      next(error);
    }
  })
  .get('/premium', async (req, res, next) => {
    try {
      const query = req.query.query?.toLowerCase();

      if (!query) {
        return res.status(400).json('Query parameter is required');
      }

      if (![PREMIUM_RESPONSE_EXCEPTION_DATA.cin.toLowerCase(), EMPTY_RESULTS_EXCEPTION.cin.toLowerCase()].includes(query)) {
        if ((query === SERVICE_ERROR_EXCEPTION_DATA.cin.toLowerCase())
          || unstabilizer(10)) {
          return res.status(503).json({ error: 'Service Unavailable' });
        }
      }

      await slower(50, 100);

      return res.status(200).json(PREMIUM_DATA.filter((company) => company.cin.toLowerCase().includes(query)));
    } catch (error) {
      next(error);
    }
  });

const api = express.Router();
api.use('/company', companyApi);

const app = express();
app.use('/api', api);
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT) + 1;
let server;

module.exports = {
  start: async () => new Promise((resolve) => {
    server = app.listen(port, () => resolve());
  }),
  stop: () => new Promise((resolve) => {
    server.close(() => resolve());
  }),
  SERVICE_ERROR_EXCEPTION_DATA,
  FREE_RESPONSE_EXCEPTION_DATA,
  PREMIUM_RESPONSE_EXCEPTION_DATA,
  EMPTY_RESULTS_EXCEPTION,
};