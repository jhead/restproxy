'use strict';

const path = require('path');
const url = require('url');
const request = require('superagent');

const methodAliases = {
  'fetch': 'get',
  'update': 'post',
  'modify': 'post',
  'change': 'post',
  'add': 'put',
  'create': 'put',
  'insert': 'put',
  'remove': 'delete'
};

const defaultOptions = {
  methodAliases,
  headers: {
    'Content-Type': 'application/json'
  }
};

function RestProxy(base, opts) {
  if (!this) return new RestProxy(base, opts);

  let options = Object.assign({}, defaultOptions);
  options = Object.assign(options, opts);

  options.headers = Object.assign({}, defaultOptions.headers);
  options.headers = Object.assign(options.headers, opts.headers);

  options.base = base;

  if (typeof base !== 'string') {
    throw new Error('Must define restproxy base API URL');
  }

  return new Proxy({ options, isRestProxy: true }, ProxyDefinition);
}

const ProxyDefinition = {
  get: (target, name) => {
    if (name in target) return target[name];
    if (typeof name === 'symbol') return target[name];

    if (~[ 'inspect', 'valueOf', 'toString' ].indexOf(name)) {
      return target[name];
    }

    let method = target.options.methodAliases[name] || name;
    if (~[ 'get', 'put', 'post', 'delete' ].indexOf(method)) {
      return (...params) => Action(target, method, ...params);
    }

    let element = (...params) => Element(target, name, ...params);
    element.path = name;
    element.options = target.options;
    element.options.headers = target.isRestProxy ?
      Object.assign({}, defaultOptions.headers) :
      element.options.headers || {};

    let elementProxy = new Proxy(element, ProxyDefinition);

    if (name === 'header') {
      return (header, value) => {
        element.options.headers[header] = value;
        return elementProxy;
      };
    }

    return elementProxy;
  }
};

function Element(parent, name, ...params) {
  if (!this) return new Element(parent, name, ...params);

  params = params.map(p => String(p));

  this.path = path.join(name, ...params);
  if (parent.path) this.path = path.join(parent.path, this.path);

  this.options = parent.options;

  return new Proxy(this, ProxyDefinition);
}

function Action(target, method, data, callback) {
  if (typeof data === 'function') {
    callback = data;
    data = undefined;
  }

  let { options } = target;

  let apiPath = target.path;
  apiPath = url.resolve(options.base + '/', apiPath);

  let headers = Object.assign({}, options.headers);
  headers = Object.assign(headers, target.requestHeaders);

  let req = request[method](apiPath);

  for (let header in headers) {
    req.set(header, headers[header]);
  }

  if (!callback) return req.send();

  req.end(callback);
}

module.exports = RestProxy;
