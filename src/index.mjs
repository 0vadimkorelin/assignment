import './helpers/env/env.mjs';
import router from './router/index.mjs';
import express from 'express';

const app = express();

app.use(express.json());
app.use('/api', router);
app.use((err, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
});
app.listen(process.env.PORT);