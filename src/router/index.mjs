import { Router } from 'express';
import verification from './verification.controller.mjs';
import webhook from './webhook.controller.mjs'; 

const router = Router();

router
  .use('/verification', verification)
  .use('/webhook', webhook);

export default router;