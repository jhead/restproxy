# RestProxy
Model your REST APIs as an object's properties/functions with no boilerplate.

## Installation
`npm install restproxy`

## Getting Started
Let's say you have a JSON REST API at `api.example.com` and you have a couple
endpoints such as:
- GET `/users` to list users
- GET `/user/:id` to fetch a user
- POST `/user:id` to update a user

It's as simple as this.
```JavaScript
const restproxy = require('restproxy');

const api = restproxy('api.example.com');
// or const api = new restproxy('api.example.com');

// GET /users
api
  .users
  .get();

// GET /user/1234
api
  .user(1234)
  .get();

// POST /user/1234 with some JSON
api
  .user(1234)
  .post({ name: 'John Smith' });
```

No boilerplate. No need to describe each endpoint and resource with classes
or functions or objects. If your API changes, you simply change your RestProxy
calls to match.

## Interfaces
RestProxy supports callbacks and promises.

### Promises
```JavaScript
api
  .users
  .put({ name: 'John Smith' })
  .then((data) => {
    // ...
  });
```

### Callbacks
```JavaScript
api
  .users
  .put({ name: 'John Smith' }, (err, data) => {

  });
```

## Aliases
To make code easier to understand, we bundle a few default aliases like so.

``` JavaScript
let user = { name: 'John Smith' };

// GET
api.users.get();
api.users.fetch();

// POST
api.user(1234).post(user);
api.user(1234).update(user);
api.user(1234).modify(user);

// PUT
api.users.put(user);
api.users.create(user);
api.users.add(user);

// DELETE
api.user(1234).delete();
api.user(1234).remove();
```

These are built-in by default but can be overridden or removed completely using
the RestProxy instance's options object.

``` JavaScript
const options = {
  // Remove all aliases
  methodAliases: {} ,

  // Custom aliases
  methodAliases: {
    'explode': 'delete'
  }
}

const api = restproxy('api.example.com', options);
```

## Headers
You can easily set default headers on your RestProxy object as well as append
headers for individual requests.

```JavaScript
const options = {
  headers: {
    // Unnecessary, this one is included by default
    'Content-Type': 'application/json',
    // But you can add other global headers as well
    'X-Token': 'my-token'
  }
};

const api = restproxy('api.example.com', options);

api
  .users
  .get(); // Content-Type + X-Token headers

// You can also specify headers on individual requests
api
  .header('Accept', 'text/html')
  .users
  .get();

// Subsequent requests on the same API object will retain global headers
// but NOT headers on previous requests, avoiding unintended side-effects.
//
// i.e. No 'Accept: text/html' header
api
  .users
  .get();
```

## HTTP library
RestProxy uses `superagent` to perform requests. I'm looking into possibly
supporting other libraries as well, PRs are welcome.
