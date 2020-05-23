'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const Controller = require('../');

mongoose.Promise = Promise;
const ObjectId = mongoose.mongo.ObjectId;

function model(name, schema = new mongoose.Schema()) {
  return mongoose.model(name, schema);
}

mongoose.connect('mongodb://localhost:27017/mongoose-controller-test');

before(function (done) {
  model('__db').db.dropDatabase(done);
});

describe('module', function () {
  it('exports a constructor', function () {
    assert.equal(typeof Controller, 'function');
    assert.ok(Controller.prototype instanceof Object);
  });
});

describe('Controller', function () {
  var Wrapped, Model, controller;

  before(function () {
    Wrapped = model('Wrapped');
    Model = model(
      'Controller',
      new mongoose.Schema({
        list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Wrapped' }],
        foo: String,
      })
    );
    controller = new Controller(Model);
  });

  describe('constructor', function () {
    it('instantiates with a Model', function () {
      controller = new Controller(Model);
    });

    it('throws if instantiated without a Model', function () {
      assert.throws(() => new Controller());
    });
  });

  describe('#count', function () {
    it('returns a promise', function () {
      assert.ok(controller.create() instanceof Promise);
    });

    it('returns a number through a promise', function () {
      return controller.count().then((n) => {
        assert.equal(typeof n, 'number');
      });
    });

    it('throws mongoose errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('count', function (_) {
        throw Error();
      });
      const Model = model('Controller#count:throws', schema);

      new Controller(Model)
        .count()
        .then(() => done(new Error('did not throw')))
        .catch(() => done());
    });
  });

  describe('#create', function () {
    it('returns a promise', function () {
      assert.ok(controller.create() instanceof Promise);
    });

    it('inserts the specified document', function () {
      return controller
        .create({ foo: 'bar' })
        .then((doc) => Model.findById(doc._id))
        .then((doc) => assert.equal(doc.foo, 'bar'));
    });

    it('throws errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('save', function (next) {
        next(new Error());
      });
      const Model = model('Controller#create:throws', schema);

      new Controller(Model)
        .create({})
        .then(() => done(new Error('did not throw')))
        .catch(() => done());
    });
  });

  describe('#find', function () {
    it('returns a promise', function () {
      assert.ok(controller.find() instanceof Promise);
    });

    it('resolves to an array', function () {
      return controller.find().then((list) => {
        assert.ok(Array.isArray(list));
      });
    });

    it('throws errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('find', function () {
        throw Error();
      });
      const Model = model('Controller#find:throws', schema);

      new Controller(Model)
        .find()
        .then(() => done(new Error('did not throw')))
        .catch(() => done());
    });
  });

  describe('#findOne', function () {
    it('returns a promise', function () {
      assert.ok(controller.findOne() instanceof Promise);
    });

    it('resolves to an object with an _id', function () {
      return controller.findOne().then((doc) => {
        assert.equal(typeof doc, 'object');
        assert.ok(!Array.isArray(doc));
        assert.equal(typeof doc._id.toString(), 'string');
      });
    });

    it('respects a where clause', function () {
      return Model.create({}).then((lhs) => {
        return controller
          .findOne({ where: { _id: lhs._id } })
          .then((rhs) => assert.equal(lhs._id.toString(), rhs._id.toString()));
      });
    });

    it('resolves to null when no match is found', function () {
      const _id = new ObjectId().toString();
      return controller.findOne({ where: { _id } }).then((doc) => {
        assert.equal(doc, null);
      });
    });

    it('throws errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('findOne', function (_) {
        throw Error();
      });
      const Model = model('Controller#findOne:throws', schema);
      const controller = new Controller(Model);

      controller
        .findOne()
        .then(() => done(new Error('did not throw')))
        .catch((_) => done());
    });
  });

  describe('#update', function () {
    it('returns a promise', function () {
      assert.ok(controller.update() instanceof Promise);
    });

    it('throws MissingId without where clause', function (done) {
      controller
        .update({}, {})
        .then(() => done(new Error('did not throw')))
        .catch((err) => {
          try {
            assert.equal(err.message, 'MissingId');
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('uses the provided doc', function () {
      return new Model()
        .save()
        .then((doc) =>
          controller.update(
            { where: { _id: doc._id } },
            {
              foo: 'bar',
            }
          )
        )
        .then((doc) => assert.equal(doc.foo, 'bar'));
    });

    it('resolves to null when no match is found', function () {
      const _id = new ObjectId().toString();
      return controller.update({ where: { _id } }).then((doc) => {
        assert.equal(doc, null);
      });
    });

    it('throws errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('save', function (next) {
        if (this.isNew) {
          next();
        } else {
          next(new Error());
        }
      });
      const Model = model('Controller#update:throws', schema);

      const controller = new Controller(Model);

      new Model()
        .save()
        .then((doc) => {
          const conditions = { where: { _id: doc._id } };
          return controller
            .update(conditions, { foo: 'bar' })
            .then(() => {
              done(new Error('did not throw'));
            })
            .catch((_) => {
              done();
            });
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe('#destroy', function () {
    it('returns a promise', function () {
      assert.ok(controller.destroy() instanceof Promise);
    });

    it('throws MissingId without where clause', function (done) {
      controller
        .destroy({})
        .then(() => done(new Error('did not throw')))
        .catch((err) => assert.equal(err.message, 'MissingId'))
        .then(() => done())
        .catch((err) => done(err));
    });

    it('uses the provided doc', function () {
      return new Model().save().then((lhs) => {
        return controller
          .destroy({ where: { _id: lhs._id } })
          .then((rhs) => assert.equal(lhs._id.toString(), rhs._id.toString()));
      });
    });

    it('resolves to null when no match is found', function () {
      const _id = new ObjectId().toString();
      return controller.destroy({ where: { _id } }).then((doc) => {
        assert.equal(doc, null);
      });
    });

    it('throws errors through a promise', function (done) {
      const schema = new mongoose.Schema();
      schema.pre('remove', function (next) {
        throw Error();
      });
      const Model = model('Controller#destroy:throws', schema);

      new Model()
        .save()
        .then((doc) => {
          return new Controller(Model)
            .destroy(
              { where: { _id: doc._id } },
              {
                foo: 'bar',
              }
            )
            .then(() => done(new Error('did not throw')))
            .catch(() => done());
        })
        .catch((err) => done(err));
    });
  });
});
