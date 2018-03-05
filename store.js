const redis = require("redis");

class Store {
  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = redis.createClient(process.env.REDIS_URL);
    } else {
      this.redis = new RedisStub();
    }
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, res) => {
        if (err) {
          reject(err);
        } else {
          let jsonValue;
          try {
            jsonValue = res ? JSON.parse(res) : null;
          } catch (ex) {
            console.log(`Failed to parse redis result "${res}"`);
          }
          resolve(jsonValue);
        }
      });
    });
  }
  set(key, value) {
    return new Promise((resolve, reject) => {
      this.redis.set(key, JSON.stringify(value), (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}
module.exports = Store;

class RedisStub {
  constructor() {
    this.values = {};
  }

  get(key, callback) {
    setTimeout(() => {
      callback(null, this.values[key]);
    }, 10);
  }

  set(key, value, callback) {
    this.values[key] = value;
    if (callback) {
      setTimeout(() => {
        callback(null);
      }, 10);
    }
  }
}
