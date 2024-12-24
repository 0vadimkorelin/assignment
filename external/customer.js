require('dotenv').config();
const EventEmitter = require('node:events');
const { v4: uuid } = require('uuid');
const express = require('express');

const PORT = Number(process.env.PORT) + 2;
const WEBHOOK_SLUG = uuid().replaceAll('-', '');
const CLIENT_WEBHOOK_URL = `http://localhost:${PORT}/api/webhook/${WEBHOOK_SLUG}`;
const CustomerEvents = new EventEmitter();

let server;

module.exports = {
  CLIENT_WEBHOOK_URL,
  CustomerEvents,
  start: () =>  new Promise((resolve) => {
    const app = express()
      .use(express.json())
      .use('/api', express.Router()
        .use('/webhook', express.Router()
          .post(`/${WEBHOOK_SLUG}`, (req, res) => {
            CustomerEvents.emit('webhook', req.body);
            return res.sendStatus(200);
          })));
    server = app.listen(PORT, () => {
      resolve();      
    });
  }),
  stop: () => new Promise((resolve) => {
    server.close(() => resolve());
  }),
};