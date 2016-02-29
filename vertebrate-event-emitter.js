// EventReference instances are keys, and objects with information about a
// callback are values.
const allHandlersPrivateData = new WeakMap();

function useCallback(eventReference, args) {
  const privateData = allHandlersPrivateData.get(eventReference);

  privateData.callback.apply(null, args);
  privateData.count--;

  return privateData.count === 0;
}

function getEventName(EventReference) {
  return allHandlersPrivateData.get(EventReference).eventName;
}

// EventReference instances are used as keys to get information about event
// callbacks. An event can also be cancelled with an EventReference instance.
export function EventReference(eventName, callback, count) {
  allHandlersPrivateData.set(this, {eventName, callback, count});
}

// This WeapMap instance has EventEmitter instances as keys, and Map instances
// as values. The Map instances have event names as keys, and Set instances as
// values. The Set instance associated with an event name contains all the
// EventHandler instances associated with the event with that name for that
// emitter.
const allEventsForAllEmitters = new WeakMap();

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

  if (count !== Infinity && (!Number.isInteger(count) || count < 1)) {
    throw new RangeError('Count must not be set to an integer less than zero or a non-integer.');
  }
}

export class EventEmitter {
  constructor() {
    allEventsForAllEmitters.set(this, new Map());
  }

  on(eventName, callback, uncheckedCount) {
    const count = uncheckedCount === undefined ? Infinity : uncheckedCount;

    checkArgs(eventName, callback, count);

    const allEventsForThisEmitter = allEventsForAllEmitters.get(this);
    const allEventsForThisEventName = allEventsForThisEmitter.get(eventName);
    const eventReference = new EventReference(eventName, callback, count);

    if (allEventsForThisEventName) {
      allEventsForThisEventName.add(eventReference);
    } else {
      allEventsForThisEmitter.set(eventName, new Set([eventReference]));
    }

    return eventReference;
  }

  off(handler) {
    const eventName = getEventName(handler);
    const allEventsForThisEmitter = allEventsForAllEmitters.get(this);
    const allEventsForThisEventName = allEventsForThisEmitter.get(eventName);

    allEventsForThisEventName.delete(handler);
  }

  trigger(eventName) {
    const allEventsForThisEmitter = allEventsForAllEmitters.get(this);
    const allEventsForThisEventName = allEventsForThisEmitter.get(eventName) || [];
    const args = Array.prototype.slice.call(arguments, 1);

    for (const eventReference of allEventsForThisEventName) {
      const done = useCallback(eventReference, args);

      if (done) {
        allEventsForThisEventName.delete(eventReference);
      }
    }
  }
}
