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
}

const defaultOptions = {
  methodAliases
}

function RestProxy(base, opts) {
  if (!this) return new RestProxy(opts);

  let options = Object.assign({}, defaultOptions);
  options = Object.assign(options, opts);
  options.base = base;

  if (typeof base !== 'string') {
    throw new Error('Must define restproxy base API URL');
  }

  return new Proxy({ options }, ProxyDefinition);
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

    return new Proxy(element, ProxyDefinition);
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

  let req = request[method](apiPath).send(data);

  if (!callback) return req;

  req.end(callback);
}

module.exports = RestProxy;
