'use strict';

const assert = require('assert');
const sinon = require('sinon');
const memwatch = require('node-memwatch');
const everything = require('../build/test.js');

const EventEmitter = everything.EventEmitter;
const EventReference = everything.EventReference;

describe('EventEmitter', () => {
  it('is a function', () => {
    assert(typeof EventEmitter, 'function');
  });

  it('creates instances of itself', () => {
    assert.ok(new EventEmitter() instanceof EventEmitter);
  });

  it('returns an EventEmitter instance when called without new', () => {
    assert.ok(EventEmitter() instanceof EventEmitter); // eslint-disable-line new-cap
  });

  describe('an instance', () => {
    let emitter;

    beforeEach(() => {
      emitter = new EventEmitter();
    });

    it('has an "on" method', () => {
      assert.equal(typeof emitter.on, 'function');
    });

    it('has an "off" method', () => {
      assert.equal(typeof emitter.off, 'function');
    });

    it('has a "trigger" method', () => {
      assert.equal(typeof emitter.trigger, 'function');
    });

    it('has an "emit" method as an alias for the "trigger" method', () => {
      assert.equal(emitter.emit, emitter.trigger);
    });

    describe('the "on" method', () => {
      it('throws when given a non-string event name', () => {
        assert.throws(
          () => emitter.on(123, () => {}),
          err => err instanceof TypeError,
          'Event name must be a string.'
        );
      });

      it('throws when given a non-function event callback', () => {
        assert.throws(
          () => emitter.on('event-name', 'blah'),
          err => err instanceof TypeError,
          'Callback must be a function.'
        );
      });

      it('throws when given zero as a count', () => {
        assert.throws(
          () => emitter.on('event-name', () => {}, 0),
          err => err instanceof RangeError,
          'Count must not be set to an integer less than zero or a non-integer.'
        );
      });

      it('throws when given a negative integer as a count', () => {
        assert.throws(
          () => emitter.on('event-name', () => {}, -1),
          err => err instanceof RangeError,
          'Count must not be set to an integer less than zero or a non-integer.'
        );
      });

      it('throws when given a float as a count', () => {
        assert.throws(
          () => emitter.on('event-name', () => {}, 1.5),
          err => err instanceof RangeError,
          'Count must not be set to an integer less than zero or a non-integer.'
        );
      });

      it('does not throw when called with a positive integer as a count', () => {
        assert.doesNotThrow(() => emitter.on('event-name', () => {}, 10));
      });

      it('does not throw when given no count', () => {
        assert.doesNotThrow(() => emitter.on('event-name', () => {}));
      });

      it('returns an EventReference', () => {
        assert.ok(emitter.on('event-name', () => {}) instanceof EventReference);
      });
    });

    describe('when the event is triggered', () => {
      let callback1;
      let callback2;
      let callback3;

      beforeEach(() => {
        callback1 = sinon.stub();
        callback2 = sinon.stub();
        callback3 = sinon.stub();

        emitter.on('test-event', callback1);
        emitter.on('test-event', callback2, 2);
        emitter.on('another-event', callback3);

        emitter.trigger('test-event', 1, 2, 3);
      });

      it('calls registered callbacks with the given arguments', () => {
        assert.deepEqual(callback1.args, [[1, 2, 3]]);
        assert.deepEqual(callback2.args, [[1, 2, 3]]);
      });

      it('calls callbacks with the emitter as context', () => {
        assert.equal(callback1.firstCall.thisValue, emitter);
      });

      it('does not call callbacks for other events', () => {
        assert.equal(callback3.callCount, 0);
      });

      it('calls callbacks every time the event is triggered', () => {
        emitter.trigger('test-event');
        emitter.trigger('test-event');
        emitter.trigger('test-event');

        assert.equal(callback1.callCount, 4);
      });

      it('stops calling a callback with a count once the count is used up', () => {
        emitter.trigger('test-event', 4, 5, 6);
        emitter.trigger('test-event', 7, 8, 9);

        assert.deepEqual(callback2.args, [[1, 2, 3], [4, 5, 6]]);
      });

      it('treats the same callback registered twice as separate callbacks', () => {
        const callback = sinon.stub();

        emitter.on('test-event', callback);
        emitter.on('test-event', callback);

        emitter.trigger('test-event', 'a', 'b', 'c');

        assert.deepEqual(callback.args, [['a', 'b', 'c'], ['a', 'b', 'c']]);
      });

      it('does not call callbacks which have been removed with a reference', () => {
        const callback = sinon.stub();

        const ref = emitter.on('test-event', callback);

        emitter.off(ref);

        emitter.trigger('test-event');

        assert.equal(callback.callCount, 0);
      });

      it('calls callbacks which have not been removed, when added more than once', () => {
        const callback = sinon.stub();

        emitter.on('test-event', callback);

        const ref = emitter.on('test-event', callback);

        emitter.off(ref);

        emitter.trigger('test-event', 'abc');

        assert.deepEqual(callback.args, [['abc']]);
      });
    });

    describe('the "allOff" method', () => {
      let callback1;
      let callback2;
      let callback3;

      let handler1;

      let anotherEmitter;

      beforeEach(() => {
        callback1 = sinon.stub();
        callback2 = sinon.stub();
        callback3 = sinon.stub();

        handler1 = emitter.on('test-event', callback1);
        emitter.on('another-event', callback2);

        anotherEmitter = new EventEmitter();
        anotherEmitter.on('test-event', callback3);
      });

      describe('when called without a name', () => {
        beforeEach(() => {
          emitter.allOff();
        });

        it('removes all listeners for the emitter', () => {
          emitter.trigger('test-event');
          emitter.trigger('another-event');

          assert.equal(callback1.callCount, 0);
          assert.equal(callback2.callCount, 0);
        });

        it('does not throw an error when removing an already removed handler', () => {
          emitter.off(handler1);
        });

        it('does not affect other emitters', () => {
          anotherEmitter.trigger('test-event');

          assert.equal(callback3.callCount, 1);
        });
      });

      describe('when called with a name', () => {
        beforeEach(() => {
          emitter.allOff('test-event');
        });

        it('removes listeners for the given name on the emitter', () => {
          emitter.trigger('test-event');
          emitter.trigger('another-event');

          assert.equal(callback1.callCount, 0);
          assert.equal(callback2.callCount, 1);
        });

        it('does not throw an error when removing an already removed handler', () => {
          emitter.off(handler1);
        });

        it('does not affect other emitters', () => {
          anotherEmitter.trigger('test-event');

          assert.equal(callback3.callCount, 1);
        });
      });
    });
  });

  describe('memory leaks', () => {
    describe('EventEmitter instances', () => {
      let hd;
      let results;

      before(() => {
        hd = new memwatch.HeapDiff();

        for (let i = 0; i < 1000; i++) {
          new EventEmitter(); // eslint-disable-line no-new
        }

        const justOne = new EventEmitter(); // eslint-disable-line no-unused-vars

        results = hd.end();
      });

      it('can be cleared by the garbarge collector', () => {
        const emitterChange = results.change.details.find(detail => detail.what === 'EventEmitter');

        assert.equal(emitterChange && emitterChange['+'], 1);
      });
    });

    describe('EventHandler instances', () => {
      let hd;
      let results;

      before(() => {
        hd = new memwatch.HeapDiff();

        for (let i = 0; i < 1000; i++) {
          new EventEmitter().on('test', () => {});
        }

        const reference = new EventEmitter().on('test', () => {}); // eslint-disable-line no-unused-vars

        results = hd.end();
      });

      it('can be cleared by the garbarge collector', () => {
        const referenceChange = results.change.details.find(detail => detail.what === 'EventReference');

        assert.equal(referenceChange && referenceChange['+'], 1);
      });
    });
  });
});
