# Senior Backend Software Developer Technical Interview Assignment

## Requirements:

### Task Overview:

The candidate will implement several API endpoints:

1. verification API
2. webhook API

# Specification

## Webhook API

### POST /api/webhook

It should accept `url` parameter (as a string) in the body of the request.

Example request:
```
curl -XPOST -H "Content-type: application/json" -d '{"url": "string"}' 'http://localhost:3000/api/webhook'
```

it should create, store and return webhook object of the folowing structure:
```
interface {
  id: string;    // unique id of the webhook
  url: string;   // url that should be called when webhook is executed
}
```

### DELETE /api/webhook/:id

It should delete webhook by webhook id.

Example request:
```
curl -XGET 'http://localhost:3000/api/webhook/<webhook_id>'
```

## Verification API

### POST /api/verification

It should accept required `query` parameter (as a string) and optional parameter `webhookId` (also as a string) in the body of the request

Example request:
```
curl -XPOST -H "Content-type: application/json" -d '{"query": "string", "webhookId": "string"}' 'http://localhost:3000/api/verification'
```

it should create, store and return a verification of the following structure:
```
interface {
  id: string;                    // unique id of the verification
  query: string;                 // initial query
  webhookId: string;             // id of the weebhook that will be called afte data is retrived from provider api
  timeStamp: string;             // verification creation date and time
  error?: any;                   // possible error from provider api
  result?: {                     // results of provider api call
    cin: string;
    name: string;
    registration_date: string;
    address: string;
    is_active: boolean;
  }[];
  source?: 'premium' | 'free';   // source of data free or premium provider api
}
```

After verification is created verification service should request free provider api (`http://localhost:3001/api/company/free?query=<query>`). Provider api will find matching results by `cin` field and return an array of results.

Provider will return following response:
```
interface {
  cin: string;
  name: string;
  registration_date: string;
  address: string;
  is_active: boolean;
}[]
```

In case provider returns error (5xx) or empty list, verification service should try calling premium provider api (`http://localhost:3001/api/company/premium?query=<query>`)

Result of that call should be written into verification object and stored.

If webhook id was provided wduring the creation of verification webhook should be called after results from provider are written into verification object.

### GET /api/verification/:id

It should find and return created verification by id field

Example request:
```
curl -XGET 'http://localhost:3000/api/verification/<verification_id>'
```

Response:
```
interface {
  id: string;
  query: string;
  webhookId: string;
  timeStamp: string;
  error?: any;
  result?: {
    cin: string;
    name: string;
    registration_date: string;
    address: string;
    is_active: boolean;
  }[];
  source?: 'premium' | 'free';
}
```

# Development

## Getting stared

This repositury allready has barebones app.

To install dependencies run `npm run i`

To run the application run `npm run verification`

To run provider app run `npm run provider`


## Repository structure

Verification api should be implemented in `test-assignment/src/router/verification.controller.mjs`

Webhook api should be implemented in `test-assignment/src/router/webhook.controller.mjs`

Candidate is free to modify `src` folder how ever he/she pleases.

## Running tests

In order to run tests use `npm run test`