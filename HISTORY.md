# History

## v3.1.1

Updated tooling, but no real code changes.

## v3.1.0

The addition of an `allOff` method to clear callbacks in batch. The addition of an `emit` method as
an alias for `trigger`.

This version has better support for older browsers such as Safari 7.1 (previously 9+) and IE11.

## v3.0.0

Rewrite to use only essential parts of ES6 (`WeakMap`, `Map`, and `Set`). Strictly speaking, only
`WeakMap` is essential, but the other two features are typically available when `WeakMap` is, and
they make the code significantly clearer.

## v2.1.0

The event emitter is now passed as a context to callbacks.

## v2.0.0

New build scripts, documentation, and tests.

## v1.0.0

Initial release
