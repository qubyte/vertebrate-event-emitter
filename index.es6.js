// The production build only needs the EventEmitter constructor, but the tests need both the
// EventEmitter and the EventHandler.
import {EventEmitter} from './vertebrate-event-emitter';

// Re-export EventEmitter as the default.
export default EventEmitter;
