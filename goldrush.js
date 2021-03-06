const axios = require('axios')

const resultsUploadUrl = process.env.GoldRushPostResults;
const resultsDownloadUrl = process.env.GoldRushGetResults;
const teamGameSize = parseInt(process.env.TeamGameSize || '4');

const Map = require('zwift-second-screen/server/map');
const Store = require('zwift-second-screen/server/store');
const { errorMessage } = require('./game/error');

const rotations = {
  1: 90,
  2: 90,
  3: 0,
  4: 0,
  5: 0
};

const counts = {
  1: 40,
  2: 10,
  3: 25,
  4: 15,
  5: 25
};

const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

const MESSAGE_DISPLAY_SECONDS = 20;

const STORE_KEYS = {
  SCORES: 'GoldRush-CurrentScore',
  WAYPOINTS: 'GoldRush-Waypoints',
  TEAMS: 'GoldRush-Teams',
  GAMESTATE: 'GoldRush-State'
}

const TEAM_LIST = [
  { name: 'Blue', colour: 'blue', match: /blue/ },
  { name: 'Red', colour: 'red', match: /red/ },
  { name: 'Green', colour: 'green', match: /green/ },
  { name: 'Orange', colour: 'orange', match: /orange/ },
  { name: 'Purple', colour: 'purple', match: /purple/ },
  { name: 'Yellow', colour: 'yellow', match: /yellow/ }
];

class GoldRush {
  constructor(worldId, code, team) {
    this.store = new Store({ ttl: 60 * 60, name: `goldrush-${worldId}-${code}` });
    this.scoreStore = new Store({ ttl: 60 * 60, name: `goldrushScores-${worldId}-${code}` });
    this.messageStore = new Store({ ttl: MESSAGE_DISPLAY_SECONDS, name: `goldrushMsg-${worldId}-${code}`, list: true });
    this.worldId = worldId;
    this.roadPoints = null;
    this.maxAltitude = 0;

    this.forceTeams = (team && team.length > 0);
    this.teams = [];

    this.state = {};
    this.waypoints = [];
    this.scores = null;
    this.messages = [];
  }

  get() {
    return this.restoreState().then(() => {
      this.checkGameState();

      return this.checkWaypoints();
    });
  }

  registerPlayer(rider, eventName, code, team) {
    try {
      const score = this.scores.find(entry => entry.rider.id === rider.id);
      if (!score) {
        this.scores.push({
          rider: { id: rider.id, firstName: rider.firstName, lastName: rider.lastName },
          score: 0,
          team: this.getTeamForNewPlayer(team)
        });

        this.scoreStore.set(rider.id, 0);
        this.saveScores();
      }
    } catch (ex) {
      console.log(`GoldRush: Exception registering player ${rider.id} - ${errorMessage(ex)}`);
    }
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
    return this.forceTeams || (this.scores && (this.scores.length >= teamGameSize));
  }

  infoPanel() {
    try {
      const details = this.state.waiting
        ? { prompt: 'Game starts', time: this.state.nextTime }
        : { prompt: 'Game ends', time: this.state.nextTime }

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
    this.scores.sort((a, b) => b.score - a.score);
    if (!this.isTeamGame()) {
      return this.scores;
    }
    return this.teams.map(t => this.countPlayersInTeam(t));
  }

  getWinners() {
    if (!this.isTeamGame()) {
      const topScore = this.scores.reduce((max, entry) => Math.max(max, entry.score), 0);
      return this.scores
        .filter(entry => entry.score > 0 && entry.score === topScore)
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

        if (value > 0) {
          const next_id = this.messages.reduce((max, msg) => Math.max(max, msg.id), 0) + 1;
          const message = {
            id: next_id,
            rider,
            text: `${value} point${value !== 1 ? 's' : ''}`,
            time: new Date()
          };
          this.messages.push(message);
          this.messageStore.set(message.id, message);
        }

        this.scoreStore.add(rider.id, value);
      }
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

  getTeamForNewPlayer(team) {
    if (team && team.length > 0) {
      // Specified team name
      if (!this.teams.find(t => t.name.toLowerCase().localeCompare(team.toLowerCase()) === 0)) {
        // New team name
        const sourceTeams = TEAM_LIST.filter(t => !this.teams.find(e => t.match.test(e.name.toLowerCase())));
        if (sourceTeams.length > 0) {
          // Use source team colour
          const matchTeam = sourceTeams.find(t => t.match.test(team.toLowerCase()));
          const useTeam = matchTeam || sourceTeams[0];
          this.teams.push(Object.assign({}, useTeam, { name: team }));
        } else {
          // No teams left
          this.teams.push({ name: team });
        }

        this.saveTeams();
      }

      return team;
    } else {
      // Auto-assign to team
      if (this.teams.length < 2) {
        // Add the next team
        const newTeam = TEAM_LIST.find(t => !this.teams.find(e => t.match.test(e.name.toLowerCase())));
        this.teams.push(newTeam || `Team ${this.team.length + 1}`);
        this.saveTeams();
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
  }

  checkGameState() {
    try {
      const dateNow = new Date();
      const minutes = dateNow.getMinutes();
      const hours = dateNow.getHours();
      
      const changeTime = 0;
      const waiting = minutes >= changeTime && minutes < changeTime + 5;

      const nextTime = new Date(
        dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate(),
        (waiting || minutes < changeTime) ? hours : hours + 1,
        changeTime + (waiting ? 5 : 0)
      );

      if (!this.state.waiting && waiting) {
        this.waypoints = [];
        this.uploadResults();
      }
      if (this.state.waiting && !waiting) {
        this.resetScores();
        this.roadPoints = null;
      }
      if (!this.state.waiting && !waiting && this.state.nextTime
          && this.state.nextTime.getHours() !== nextTime.getHours()) {
        // Reset
        this.waypoints = [];
        this.resetScores();
        this.roadPoints = null;
      }

      if ((this.state.waiting !== waiting)
        || (this.state.nextTime.getTime() !== nextTime.getTime())) {
        this.state = {
          waiting,
          nextTime: nextTime
        };
        this.saveGameState();
      }
    } catch (ex) {
      console.log(`GoldRush: Exception checking game state - ${errorMessage(ex)}`);
    }
  }

  restoreState() {
    return Promise.all([
      this.store.getMulti([STORE_KEYS.SCORES, STORE_KEYS.WAYPOINTS, STORE_KEYS.TEAMS, STORE_KEYS.GAMESTATE]),
      this.messageStore.getAll()
    ]).then(([multiValues, messages]) => {
      const [scores, waypoints, teams, gameState] = multiValues;
      if (!scores || !gameState) {
        this.resetScores();
      } else {
        this.scores = scores;
        this.teams = teams.filter(t => !!t) || [];
        this.state = {
          waiting: gameState.waiting,
          nextTime: new Date(gameState.nextTime)
        };

        this.messages = messages || [];
        if (waypoints) {
          this.waypoints = waypoints;
        }

        if (this.scores.length) {
          return Promise.all(this.scores
            .filter(score => !!score)
            .map(score =>
              this.scoreStore.get(score.rider.id).then(riderScore => {
                score.score = riderScore || 0;
              })
            ));
        }
      }
    }).catch(ex => {
      console.log(`GoldRush: Error restoring scores and waypoints after reset - ${errorMessage(ex)}`);
      this.resetScores();
    });
  }

  resetScores() {
    this.scores = [];
    this.teams = [];
    this.saveScores();
    this.saveTeams();
  }

  saveScores() {
    const players = this.scores.map(({rider, team}) => ({rider, team}));
    return this.store.set(STORE_KEYS.SCORES, players).catch(ex => {
      console.log(`GoldRush: Error saving scores to store - ${errorMessage(ex)}`);
    });
  }

  saveTeams() {
    return this.store.set(STORE_KEYS.TEAMS, this.teams).catch(ex => {
      console.log(`GoldRush: Error saving teams to store - ${errorMessage(ex)}`);
    });
  }

  saveGameState() {
    return this.store.set(STORE_KEYS.GAMESTATE, this.state).catch(ex => {
      console.log(`GoldRush: Error saving game state to store - ${errorMessage(ex)}`);
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
        const next_id = this.waypoints.reduce((max, point) => Math.max(max, parseInt(point.id.substring(5))), 0) + 1;
        const id = `Gold-${next_id}`;

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
            if (classes.find(c => c == 'roadsegment') && classes.find(c => c == 'cycling')) {
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
