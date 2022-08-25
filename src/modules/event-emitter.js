const EventEmitter = {
  _events: {},
  _subscribers: {},
  dispatch: function (event, data) {
    if (!this._events[event]) return;
    setTimeout(() => this._events[event].forEach((callback) => callback(data))); // break out of the render cycle
  },
  on: function (event, callback, subscriber) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
    if (subscriber) {
      if (!this._subscribers[subscriber]) this._subscribers[subscriber] = [];
      this._subscribers[subscriber].push(callback);
    }
  },
  off: function (event, subscriber) {
    this._events[event] = (this._events[event] || []).filter((cb1) => {
      var found = false;
      (this._subscribers[subscriber] || []).forEach((cb2) => {
        if (cb1 === cb2) found = true;
      });
      return !found;
    });
  }
};

export default EventEmitter;
