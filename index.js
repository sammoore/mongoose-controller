'use strict';

const { keys } = Object;

const assert = require('assert');
const pick = require('lodash.pick');
const mongoose = require('mongoose');

mongoose.Promise = Promise;

const MODEL = Symbol();

function Controller(Model) {
  if (!(this instanceof Controller)) {
    return new Controller(Model);
  }

  if (Object.getPrototypeOf(Model) != mongoose.Model) {
    throw new TypeError('Model must be a mongoose.Model');
  }

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

  return buildQuery(this.Model.count(), conditions).exec();
};

Controller.prototype.create = function (doc) {
  return new this.Model(doc).save().then((model) => {
    return model;
  });
};

Controller.prototype.find = function (conditions = {}, doc) {
  return buildQuery(this.Model.find(), conditions).exec();
};

Controller.prototype.findOne = function (conditions = {}, doc) {
  return buildQuery(this.Model.findOne(), conditions).exec();
};

Controller.prototype.update = function (conditions = {}, doc) {
  if (!conditions.where || !conditions.where._id) {
    return Promise.reject(new Error('MissingId'));
  }

  return buildQuery(this.Model.findOne(), conditions).exec()
  .then((model) => {
    if (!model) return null;

    return model.set(doc).save();
  });
};

Controller.prototype.destroy = function (conditions = {}, doc) {
  if (!conditions.where || !conditions.where._id) {
    return Promise.reject(new Error('MissingId'));
  }

  console.log(conditions.where._id);
  return buildQuery(this.Model.findOne(), conditions).exec()
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

function buildQuery(query, conditions) {
  let supported = pick(conditions, SUPPORTED);

  for (var key in supported) {
    query[key](conditions[key]);
  }
  
  return query;
}

module.exports = Controller;
