'use strict';

const { assign, keys } = Object;

const assert = require('assert');
const mongoose = require('mongoose');
const pick = require('lodash.pick');

mongoose.Promise = Promise;

const MODEL = Symbol();

function Controller(Model, options) {
  if (!(this instanceof Controller)) {
    return new Controller(Model, options);
  }

  if (Object.getPrototypeOf(Model) != mongoose.Model) {
    throw new TypeError('Model must be a mongoose.Model');
  }

  this.options = assign({ whitelist: [], blacklist: [], queries: {} }, options || {});
  this[MODEL] = Model;
}

Object.defineProperty(Controller.prototype, 'Model', {
  get: function () {
    return this[MODEL];
  }
});

Controller.prototype.count = function (conditions = {}) {
  try {
    delete conditions.populate;
  } catch (err) {}

  return buildQuery(this.Model.count(), conditions, this.options).exec();
};

Controller.prototype.create = function (doc) {
  return new this.Model(doc).save().then((model) => {
    return model;
  });
};

Controller.prototype.find = function (conditions = {}, doc) {
  return buildQuery(this.Model.find(), conditions, this.options).exec();
};

Controller.prototype.findOne = function (conditions = {}, doc) {
  return buildQuery(this.Model.findOne(), conditions, this.options).exec();
};

Controller.prototype.update = function (conditions = {}, doc) {
  if (!conditions.where || !conditions.where._id) {
    return Promise.reject(new Error('MissingId'));
  }

  return buildQuery(this.Model.findOne(), conditions, this.options).exec()
  .then((model) => {
    if (!model) return null;

    return model.set(doc).save();
  });
};

Controller.prototype.destroy = function (conditions = {}, doc) {
  if (!conditions.where || !conditions.where._id) {
    return Promise.reject(new Error('MissingId'));
  }

  return buildQuery(this.Model.findOne(), conditions, this.options).exec()
  .then((model) => {
    if (!model) return null;

    return model.remove();
  });
};

const SUPPORTED = [
  'skip',
  'populate',
  'limit',
  'sort',
  'select',
  'where'
];

function buildQuery(query, conditions, options) {
  const { blacklist, whitelist } = options;
  const supported = SUPPORTED.filter(k => !(k in blacklist)).concat(whitelist);

  conditions = pick(conditions, supported);

  for (var key in conditions) {
    if (key in options.queries) {
      var configure = options.queries[key];
      configure(query, conditions[key]);
    } else {
      query[key](conditions[key]);
    }
  }
  
  return query;
}

module.exports = Controller;
