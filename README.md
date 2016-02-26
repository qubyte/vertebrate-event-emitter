# Vertebrate event emitter

This repository contains an implementation of an event emitter. Working with
emitters can be frustrating. These frustrations led me to make an ES2015 based
implementation contained in this repository.

## Problems with existing emitters

### Emitters make memory leaks too easy to create

For example, if you add an event listener to a Backbone event emitter using
`on`, it will stay there until something removes it. Backbone tries to get
around this with `listenTo`, which allows the emitter itself to unregister
events in batch. This is no fault of existing implementations. JavaScript itself
made it an impossible problem to solve until recently.

Luckily, one of the earlier features of ES2015 to make it into browsers was
`WeakMap`, which allows the garbage collector to clean up members when no other
references to them remain. The Vertebrate event emitter uses these to avoid
memory leaks.

### Most implementations are keyed on event name and a callback

In Node.js, you might have code like:

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

function testCallback() {
  console.log('Hello, world!');
}

emitter.on('test', testCallback); // Add a listener to the 'test' event.

emitter.removeListener('test', testCallback); // Remove the listener.
```

That looks fine, but what happens when you add the same callback for an event
twice? Does the callback get called twice per emission, or just once? If twice,
what happens when you remove the listener? Does it remove both or just one?

This ambiguity bothers me.

When a Vertebrate emitter has a listener registered for an event, it returns a
reference object, a lot like `setTimeout` does. Unregistering the event is done
using this reference object:

```javascript
import VertebrateEventEmitter from 'vertebrate-event-emitter';

const emitter = new VertebrateEventEmitter();

function testCallback() {
  console.log('Hello, world!');
}

const ref = emitter.on('test', testCallback); // Add a listener.

emitter.off(ref); // Remove the listener. No need to use the event name.
```

You get a fresh reference object each time a listener is registered, so the
ambiguity never arises.

## API

### Class `VertebrateEventEmitter`

The `VertebrateEventEmitter` is used to construct new emitter objects. It takes
no arguments.

```javascript
const emitter = new VertebrateEventEmitter();
```

### `reference = emitter.on(name, callback, count = Infinity)`

Add a listener function `callback` to the emitter for the given `name`. `name`
must be a string. `count` is the number of times the event can be called before
the listener is automatically unregistered. `count` defaults to `Infinity` when
not given. When given it must be a positive integer greater than `1`, or
`Infinity`.

A `reference` object is returned, which may later be used to unregister the
listener.

### `emitter.off(reference)`

Unregister an event listener using the `reference` object returned by
`emitter.on`.

### `emitter.trigger(name, ...args)`

Trigger all handlers for the given name with the remaining arguments `args`.

```javascript
function testCallback(a, b, c) {
  console.log(a, b, c);
}

emitter.on('some-event', testCallback);

emitter.trigger('some-event', 1, 2, 3) // logs: 1, 2, 3
```
