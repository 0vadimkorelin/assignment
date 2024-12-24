import { Router } from 'express';

const webhookRouter = Router();

webhookRouter
  .post('/', (req, res, next) => {
  })
  .delete('/:id', (req, res, next) => {
  });

export default webhookRouter;