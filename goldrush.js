const axios = require('axios')
const moment = require('moment');

const resultsUploadUrl = process.env.GoldRushPostResults;
const resultsDownloadUrl = process.env.GoldRushGetResults;

const Map = require('zwift-second-screen/server/map');
const Store = require('./store');
const { errorMessage } = require('./game/error');

const rotations = {
  1: 90,
  2: 90,
  3: 0
};

const counts = {
  1: 40,
  2: 10,
  3: 25
};

const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

let coin_id = 1;
let message_id = 1;

const MESSAGE_DISPLAY_SECONDS = 20;

const STORE_KEYS = {
  SCORES: 'GoldRush-CurrentScore',
  TIME: 'GoldRush-SetupTime',
  WAYPOINTS: 'GoldRush-Waypoints'
}

class GoldRush {
  constructor(worldId) {
    this.store = new Store();
    this.worldId = worldId;
    this.roadPoints = null;
    this.maxAltitude = 0;

    this.teams = [
      { name: 'Blues', colour: 'blue' },
      { name: 'Reds', colour: 'red' }
    ];

    this.state = {};
    this.waypoints = [];
    this.scores = null;
    this.messages = [];
  }

  get() {
    return this.checkRestore().then(() => {
      this.checkGameState();

      return this.checkWaypoints();
    });
  }

  registerPlayer(rider) {
    this.addPlayerScore(rider, 0);
  }

  modifyPositions(positions) {
    if (!this.isTeamGame()) {
      return positions;
    }

    return positions.map(p => {
      const score = this.scores.find(s => s.rider.id === p.id);
      if (score) {
        const team = this.teams.find(t => t.name === score.team);
        if (team) {
          return Object.assign({}, p, {
            colour: team.colour
          });
        }
      }
      return p;
    });
  }

  isTeamGame() {
    return this.scores && (this.scores.length > 3);
  }

  infoPanel() {
    try {
      const details = this.state.waiting
        ? { prompt: 'Game starts', time: this.state.nextTime }
        : { prompt: 'Game ends', time: this.state.nextTime }

      this.removeOldMessages();
      const messages = {
        type: this.state.waiting ? 'banner' : 'list',
        list: this.state.waiting ? this.getWinners() : this.messages
      };

      return {
        details,
        messages,
        scores: this.displayScores()
      };
    } catch (ex) {
      console.log(`GoldRush: Exception getting info panel - ${errorMessage(ex)}`);
      return {};
    }
  }

  displayScores() {
    if (!this.isTeamGame()) {
      return this.scores;
    }
    return this.teams.map(t => this.countPlayersInTeam(t));
  }

  getWinners() {
    if (!this.isTeamGame()) {
      const topScore = this.scores.reduce((max, entry) => Math.max(max, entry.score), 0);
      return this.scores
        .filter(entry => entry.score === topScore)
        .map(entry => ({ id: `winner-${entry.rider.id}`, rider: entry.rider, text: `WINS!` }));
    } else {
      const teamScores = this.teams.map(t => this.countPlayersInTeam(t));
      const topScore = teamScores.reduce((max, entry) => Math.max(max, entry.score), 0);
      const winningTeams = teamScores.filter(entry => entry.score === topScore)

      if (winningTeams.length === 1) {
        return [
          { text: `${winningTeams[0].name} WIN!` }
        ];
      } else {
        return [
          { text: `${winningTeams.map(t => t.name).join(' and ')} DRAW!` }
        ];
      }
    }
  }

  visited(point, rider, time) {
    try {
      const index = this.waypoints.findIndex(p => p.x === point.x && p.y === point.y);
      if (index !== -1) {
        const waypoint = this.waypoints[index];
        this.waypoints.splice(index, 1);

        this.addPlayerScore(rider, waypoint.value);

        if (waypoint.image == 'goldrush_chest') {
          // Spawn some new nearby waypoints
          for(let n = 0; n < 4; n++) {
            this.newWaypoint(5000, point => distance(point, waypoint) < 30000);
          }
        }
        this.saveWaypoints();
      }
    } catch (ex) {
      console.log(`GoldRush: Exception marking point visited by ${rider.id} - ${errorMessage(ex)}`);
    }
  }

  addPlayerScore(rider, value) {
    try {
      const score = this.scores.find(entry => entry.rider.id === rider.id);
      if (score) {
        score.score += value;
      } else {
        this.scores.push({
          rider: { id: rider.id, firstName: rider.firstName, lastName: rider.lastName },
          score: value,
          team: this.getTeamForNewPlayer()
        })
      }

      if (value > 0) {
        this.messages.push({
          id: message_id++,
          rider,
          text: `${value} point${value !== 1 ? 's' : ''}`,
          time: new Date()
        });
      }

      this.scores.sort((a, b) => b.score - a.score);

      this.saveScores();
    } catch (ex) {
      console.log(`GoldRush: Exception adding player score for ${rider.id} - ${errorMessage(ex)}`);
    }
  }

  countPlayersInTeam(team) {
    return this.scores.reduce((total, score) => {
      if (score.team === team.name) {
        return {
          name: total.name,
          colour: total.colour,
          count: total.count + 1,
          score: total.score + score.score,
          scores: total.scores.concat([score])
        };
      }
      return total;
    }, { name: team.name, colour: team.colour, count: 0, score: 0, scores: [] });
  }

  getTeamForNewPlayer() {
    if (this.teams.length < 2) {
      return null;
    }

    const counts = this.teams.map(t => this.countPlayersInTeam(t));

    counts.sort((c1, c2) => {
      const diff = c1.count - c2.count;
      if (diff === 0) {
        return c1.score - c2.score;
      }
      return diff;
    });

    return counts[0].name;
  }

  removeOldMessages() {
    this.messages = this.messages.filter(message => (new Date() - message.time) < MESSAGE_DISPLAY_SECONDS * 1000);
  }

  checkGameState() {
    try {
      const dateNow = new Date();
      const minutes = dateNow.getMinutes();
      const waiting = minutes < 5;

      dateNow.setMinutes(waiting ? 5 : 0, 0, 0);
      if (!waiting) {
        dateNow.setHours(dateNow.getHours() + 1);
      }

      if (!this.state.waiting && waiting) {
        this.waypoints = [];
        this.uploadResults();
      }
      if (this.state.waiting && !waiting) {
        this.resetScores();
        this.roadPoints = null;
      }
      if (!this.state.waiting && !waiting && this.state.nextTime
          && this.state.nextTime.getHours() !== dateNow.getHours()) {
        // Reset
        this.waypoints = [];
        this.resetScores();
        this.roadPoints = null;
      }

      this.state = {
        waiting,
        nextTime: dateNow
      };
    } catch (ex) {
      console.log(`GoldRush: Exception checking game state - ${errorMessage(ex)}`);
    }
  }

  checkRestore() {
    if (!this.scores) {
      if (!this.restorePromise) {
        this.restorePromise = Promise.all([
          this.store.get(STORE_KEYS.SCORES),
          this.store.get(STORE_KEYS.TIME),
          this.store.get(STORE_KEYS.WAYPOINTS)
        ]).then(([scores, time, waypoints]) => {
          const getHoursFromTime = timeObj => {
            if ( timeObj && timeObj.date ) {
              return new Date(Date.parse(timeObj.date)).getHours()
            }
            return -1;
          };

          if (!scores || (getHoursFromTime(time) !== (new Date()).getHours())) {
            console.log('GoldRush: Resetting scores and waypoints after reset');
            this.resetScores();
          } else {
            console.log('GoldRush: Restoring scores and waypoints after reset');

            this.scores = scores;
            if (waypoints) {
              this.waypoints = waypoints;
              coin_id = this.waypoints.reduce((max, point) => Math.max(max, parseInt(point.id.substring(5))), 0) + 1;
            }
          }

          this.restorePromise = null;
        }).catch(ex => {
          console.log(`GoldRush: Error restoring scores and waypoints after reset - ${errorMessage(ex)}`);
          this.resetScores();

          this.restorePromise = null;
        });
      }

      return this.restorePromise;
    } else {
      return Promise.resolve();
    }
  }

  resetScores() {
    this.scores = [];
    this.saveScores();
    this.store.set(STORE_KEYS.TIME, { date: new Date() })
        .catch(ex => {
          console.log(`GoldRush: Error saving time to store - ${errorMessage(ex)}`);
        });
  }

  saveScores() {
    return this.store.set(STORE_KEYS.SCORES, this.scores)
        .catch(ex => {
          console.log(`GoldRush: Error saving scores to store - ${errorMessage(ex)}`);
        });
  }

  saveWaypoints() {
    return this.store.set(STORE_KEYS.WAYPOINTS, this.waypoints)
        .catch(ex => {
          console.log(`GoldRush: Error saving waypoints to store - ${errorMessage(ex)}`);
        });
  }

  checkWaypoints() {
    if (this.state.waiting) {
      return Promise.resolve([]);
    } else {
      return new Promise(resolve => {
        this.getRoadPoints().then(() => {
          if (this.waypoints.length < counts[this.worldId]) {
            while(this.waypoints.length < counts[this.worldId]) {
              this.newWaypoint(25000);
            }

            this.saveWaypoints();
          }

          resolve(this.waypoints);
        }).catch(ex => {
          console.log(`Failed to check waypoints for world ${this.worldId}${errorMessage(ex)}`);
          resolve(null);
        })
      });
    }
  }

  newWaypoint(minDistance, pointsFilter) {
    const roadPoints = pointsFilter
        ? this.roadPoints.filter(pointsFilter)
        : this.roadPoints;

    let attempts = 0;
    let added = false;
    while (!added && attempts < 10) {
      const index = Math.floor(Math.random() * roadPoints.length);
      const roadPoint = roadPoints[index];

      if (!this.waypoints.find(waypoint => distance(roadPoint, waypoint) < minDistance)) {
        const { x, y, altitude } = roadPoint;
        const id = `Gold-${coin_id++}`;

        const altitudeRatio = Math.max(0.3, altitude / this.maxAltitude);
        const isChest = pointsFilter ? false : Math.random() < (altitudeRatio * 0.1);
        const value = isChest ? 0 : Math.random() < (altitudeRatio * 0.6) ? 3 : 1;

        this.waypoints.push({
          name: id,
          x,
          y,
          rotate: rotations[this.worldId],
          image: `goldrush_${isChest ? 'chest' : value}`,
          id,
          value
        });
        added = true;
      }
      attempts++;
    }
  }

  getRoadPoints() {
    if (this.roadPoints) {
      return Promise.resolve(this.roadPoints);
    }

    const map = new Map({});
    return map.getSvg(this.worldId).then(svg => {
      // <polyline points="x1,y1 x2,y2"></polyline>
      let index = 0;
      const pointSets = [];
      while (index < svg.length && index !== -1) {
        index = svg.indexOf('<polyline ', index);
        if (index !== -1) {
          // Check for the points
          const polyline = this.getAttribute(svg, index, 'points');
          if (polyline) {
            // Get the class
            const className = this.getAttribute(svg, index, 'class') || '';
            const classes = className.split(' ');
            if (classes.find(c => c == 'roadsegment')) {
              // See if there's an altitude
              const altitudeClass = classes.find(c => c.startsWith('altitude_'));
              const altitude = altitudeClass ? parseInt(altitudeClass.substring(9)) : 0;

              pointSets.push(this.pointsFromPolyline(polyline, altitude));
            }
          }
          index += 8;
        }
      }

      this.roadPoints = [].concat.apply([], pointSets);

      this.maxAltitude = this.roadPoints.reduce((max, point) => Math.max(max, point.altitude), 0);
      return this.roadPoints;
    });
  }

  getAttribute(elementStr, elementIndex, attributeName) {
    const index = elementStr.indexOf(`${attributeName}="`, elementIndex);
    if (index !== -1) {
      const len = attributeName.length + 2;
      const endIndex = elementStr.indexOf('"', index + len);
      if (endIndex !== -1) {
        return elementStr.substring(index + len, endIndex);
      }
    }
    return null;
  }

  pointsFromPolyline(polyline, altitude) {
    return polyline.split(' ')
        .map(pair => {
          const coords = pair.split(',');
          if (coords.length === 2) {
            return { x: parseFloat(coords[0]), y: parseFloat(coords[1]), altitude };
          }
        })
        .filter(point => !!point);
  }

  uploadResults() {
    if (resultsUploadUrl && this.scores.find(s => s.score > 0)) {
      const body = {
        value1: JSON.stringify(this.scores)
      };
      axios.post(resultsUploadUrl, body)
          .catch(function (ex) {
            console.log(`GoldRush: Error uploading results - ${errorMessage(ex)}`);
          });
    }
  }
}

module.exports = GoldRush;
