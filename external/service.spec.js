require('dotenv').config();
const Customer = require('./customer');
const Provider = require('./provider');
const SERVICE_URL = `http://localhost:${process.env.PORT}`;

function createWebhook(payload) {
  return fetch(`${SERVICE_URL}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function deleteWebhook(id) {
  return fetch(`${SERVICE_URL}/api/webhook/${id ?? ''}`, {
    method: 'DELETE',
  });
}

function createVerification(payload) {
  return fetch(`${SERVICE_URL}/api/verification`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function getVerification(id) {
  return fetch(`${SERVICE_URL}/api/verification/${id}`);
}

beforeAll(async () => {
  await Provider.start();
  await Customer.start();
})

afterAll(async () => {
  await Provider.stop();
  await Customer.stop();
});

describe('Webhook API', () => {
  describe('POST /webhook', () => {
    it('should create webhook according to spec', async () => {
      const respones = await createWebhook({
        url: 'https://google.com',
      });
      const data = await respones.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('url');
      expect(Object.keys(data)).toHaveLength(2);
      expect(respones.status).toBe(201);
    });

    it('url should be required', async () => {
      const respones = await createWebhook({});
      expect(respones.status).toBe(400);
    });

    it('url should be a string', async () => {
      const goodRequeestResponse = await createWebhook({
        url: 'https://google.com',
      });
      expect(goodRequeestResponse.status).toBe(201);

      const badRequestResponses = [
        await createWebhook({ url: 1 }),
        await createWebhook({ url: true }),
        await createWebhook({ url: [] }),
        await createWebhook({ url: {} }),
      ];
      badRequestResponses.forEach((request) => expect(request.status).toBe(400));
    });
  });

  describe('DELETE /webhook', () => {
    it('should delete webhook', async () => {
      const createResponse = await createWebhook({ url: 'https://google.com' });
      const { id } = await createResponse.json();

      const deleteResponse = await deleteWebhook(id);
      expect(deleteResponse.status).toBe(200);

      const repeatDeleteResponse = await deleteWebhook(id);
      expect(repeatDeleteResponse.status).toBe(404);
    });
  });
});

describe('verification API', () => {
  describe('POST /verification', () => {
    it('response should match spec', async () => {
      const response = await createVerification({
        webhookId: 'https://google.com',
        query: 'OYL',
      });
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('timeStamp');
      expect(data).toHaveProperty('webhookId');
      expect(Object.keys(data)).toHaveLength(4);
      expect(response.status).toBe(201)
    });

    it('query should be required', async () => {
      const response = await createVerification({});
      expect(response.status).toBe(400);
    });

    it('query should be string', async () => {
      const goodRequeest = await createVerification({
        query: 'OYL',
      });
      expect(goodRequeest.status).toBe(201);

      const badRequests = [
        await createVerification({ query: 1 }),
        await createVerification({ query: true }),
        await createVerification({ query: [] }),
        await createVerification({ query: {} }),
      ];
      badRequests.forEach((request) => expect(request.status).toBe(400));
    });

    it('webhookId should not be required', async () => {
      const response = await createVerification({
        query: 'OYL',
      });
      expect(response.status).toBe(201);
    });

    it('webhookId should be string', async () => {
      const goodRequeest = await createVerification({
        query: 'OYL',
        webhookId: 'https://google.com',
      });
      expect(goodRequeest.status).toBe(201);

      const badRequests = [
        await createVerification({ query: 'OYL', webhookId: 1 }),
        await createVerification({ query: 'OYL', webhookId: true }),
        await createVerification({ query: 'OYL', webhookId: [] }),
        await createVerification({ query: 'OYL', webhookId: {} }),
      ];
      badRequests.forEach((request) => expect(request.status).toBe(400));
    });

    it('should not contain any extra parameter', async () => {
      const response = await createVerification({
        query: 'OYL',
        extra: true,
      });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /verification', () => {
    let webhookId;
    beforeAll(async () => {
      const response = await createWebhook({
        url: Customer.CLIENT_WEBHOOK_URL,
      });
      webhookId = (await response.json()).id;
    });

    afterAll(async () => {
      await deleteWebhook(webhookId);
    });

    it('should return verification', async () => {
      const createResponse = await createVerification({ query: 'OYL' });
      const verification = await createResponse.json();
      const response = await getVerification(verification.id);
      expect(response.status).toBe(200);
    });

    it('should return error info', async () => {
      const createResponse = await createVerification({
        query: Provider.SERVICE_ERROR_EXCEPTION_DATA.cin,
        webhookId,
      });
      const { id } = await createResponse.json();

      const webhookData = await new Promise((resolve) => {
        Customer.CustomerEvents.on('webhook', (data) => {
          if (data.id === id) {
            resolve(data);
          }
        });
      });

      const getResponse = await getVerification(id);
      const data = await getResponse.json();

      expect(data).toEqual(webhookData);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Service Unavailable');
    });

    it('should return company info from free source', async () => {
      const createResponse = await createVerification({
        query: Provider.FREE_RESPONSE_EXCEPTION_DATA.cin,
        webhookId,
      });
      const { id } = await createResponse.json();

      const webhookData = await new Promise((resolve) => {
        Customer.CustomerEvents.on('webhook', (data) => {
          if (data.id === id) {
            resolve(data);
          }
        });
      });

      const getResponse = await getVerification(id);
      const data = await getResponse.json();

      expect(data).toEqual(webhookData);
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('result');
      expect(data.source).toBe('free');
      expect(data.result).toEqual([Provider.FREE_RESPONSE_EXCEPTION_DATA]);
    });

    it('should return company info from premium source', async () => {
      const createResponse = await createVerification({
        query: Provider.PREMIUM_RESPONSE_EXCEPTION_DATA.cin,
        webhookId,
      });
      const { id } = await createResponse.json();

      const webhookData = await new Promise((resolve) => {
        Customer.CustomerEvents.on('webhook', (data) => {
          if (data.id === id) {
            resolve(data);
          }
        });
      });

      const getResponse = await getVerification(id);
      const data = await getResponse.json();

      expect(data).toEqual(webhookData);
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('result');
      expect(data.source).toBe('premium');
      expect(data.result).toEqual([Provider.PREMIUM_RESPONSE_EXCEPTION_DATA]);
    });

    it('should return company info from premium source when free source is empty', async () => {
      const createResponse = await createVerification({
        query: Provider.EMPTY_RESULTS_EXCEPTION.cin,
        webhookId,
      });
      const { id } = await createResponse.json();

      const webhookData = await new Promise((resolve) => {
        Customer.CustomerEvents.on('webhook', (data) => {
          if (data.id === id) {
            resolve(data);
          }
        });
      });

      const getResponse = await getVerification(id);
      const data = await getResponse.json();

      expect(data).toEqual(webhookData);
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('result');
      expect(data.source).toBe('premium');
      expect(data.result).toEqual([Provider.EMPTY_RESULTS_EXCEPTION]);
    });
  });
});