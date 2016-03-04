// EventReference instances are keys, and objects with information about a
// callback are values.
var allHandlersPrivateData = new WeakMap();

function useCallback(emitter, eventReference, args) {
  var privateData = allHandlersPrivateData.get(eventReference);

  privateData.callback.apply(emitter, args);
  privateData.count--;

  return privateData.count === 0;
}

function getEventName(EventReference) {
  return allHandlersPrivateData.get(EventReference).eventName;
}

// EventReference instances are used as keys to get information about event
// callbacks. An event can also be cancelled with an EventReference instance.
export function EventReference(eventName, callback, count) {
  allHandlersPrivateData.set(this, {eventName: eventName, callback: callback, count: count});
}

// This WeapMap instance has EventEmitter instances as keys, and Map instances
// as values. The Map instances have event names as keys, and Set instances as
// values. The Set instance associated with an event name contains all the
// EventHandler instances associated with the event with that name for that
// emitter.
var allEventsForAllEmitters = new WeakMap();

function checkArgs(eventName, callback, count) {
  if (typeof eventName !== 'string') {
    throw new TypeError('Event name must be a string.');
  }

  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function.');
  }

  if (typeof count !== 'number') {
    throw new TypeError('When given, count must be a number.');
  }

  if (count !== Infinity && (Math.floor(count) !== count || count < 1)) {
    throw new RangeError('Count must not be set to an integer less than zero or a non-integer.');
  }
}

export function EventEmitter() {
  if (!(this instanceof EventEmitter)) {
    return new EventEmitter();
  }

  allEventsForAllEmitters.set(this, new Map());
}

EventEmitter.prototype.on = function (eventName, callback, uncheckedCount) {
  var count = uncheckedCount === undefined ? Infinity : uncheckedCount;

  checkArgs(eventName, callback, count);

  var allEventsForThisEmitter = allEventsForAllEmitters.get(this);
  var allEventsForThisEventName = allEventsForThisEmitter.get(eventName);
  var eventReference = new EventReference(eventName, callback, count);

  if (allEventsForThisEventName) {
    allEventsForThisEventName.add(eventReference);
  } else {
    allEventsForThisEmitter.set(eventName, new Set([eventReference]));
  }

  return eventReference;
};

EventEmitter.prototype.off = function (handler) {
  var eventName = getEventName(handler);
  var allEventsForThisEmitter = allEventsForAllEmitters.get(this);
  var allEventsForThisEventName = allEventsForThisEmitter.get(eventName);

  allEventsForThisEventName.delete(handler);
};

EventEmitter.prototype.trigger = function (eventName) {
  var allEventsForThisEmitter = allEventsForAllEmitters.get(this);
  var allEventsForThisEventName = allEventsForThisEmitter.get(eventName) || [];
  var args = Array.prototype.slice.call(arguments, 1);
  var emitter = this;

  allEventsForThisEventName.forEach(function (eventReference) {
    var done = useCallback(emitter, eventReference, args);

    if (done) {
      allEventsForThisEventName.delete(eventReference);
    }
  });
};
