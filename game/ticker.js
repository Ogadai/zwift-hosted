const { errorMessage } = require('./error');

class Ticker {
  constructor(riderProvider, eventName) {
    this.eventName = eventName;
    this.onTick = null;
    this.lastRequestDate = null;
    this.lastPollDate = null;

    if (riderProvider.loginAnonymous) {
      const result = riderProvider.loginAnonymous();
      this.anonRider = riderProvider.getAnonymous(result.cookie);
      this.anonRider.setFilter(`event:${eventName}`);
    }
  }

  trigger() {
    this.lastRequestDate = new Date();
    if (!this.anonRider) return;

    if (!this.lastPollDate || (new Date() - this.lastPollDate) > 10000) {
      setTimeout(() => this.update(), 1);
    }
  }

  update() {
    this.lastPollDate = new Date();

    this.anonRider.getPositions().then(positions => {
      if (this.onTick) {
        this.onTick(positions);
      }

      if (this.lastRequestDate && (new Date() - this.lastRequestDate) < 1 * 60000) {
        // Keeps going for 10 minutes
        setTimeout(() => this.update(), 2500);
      }
    }).catch(function (ex) {
      console.log(`${this.eventName}: Error getting updating rider positions - ${errorMessage(ex)}`);
    });
  }
}

module.exports = {
  Ticker
}
