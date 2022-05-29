const log = require('../utils/log.js');

const MAXIMUM_SAMPLE_INTERVAL = 1000; // Milliseconds
const MAXIMUM_DISTANCE_INTERVAL = 1000; // Meters
const ROTATION_ANGLE_THRESHOLD = 0.1; // Degrees

const EARTH_RADIUS = 6371000; // Meters

const EPSILON = 0.01; // Zero

module.exports = {
  name: 'simplifyCurve',

  transformEach(data, index, dataset) {
    // Always take the first data point
    if (!this.previousTaken) {
      return this._take(data, 'first data point');
    }

    const distFromPreviousTaken = distance(this.previousTaken, data);

    // Drop data point that is not moving
    if (distFromPreviousTaken < EPSILON) {
      return this._drop('point not moving');
    }

    // Take data point that is 1 sec from previous one
    if (data.Milliseconds - this.previousTaken.Milliseconds >= MAXIMUM_SAMPLE_INTERVAL) {
      return this._take(data, 'time interval exceeds threshold');
    }

    /*         A (this.previousTaken2)  B (this.previousTaken)
     *         |                        |
     *         v                        v
     *   ooooooXooooooooooooooooooooooooXooooo  <-- C (previous)
     *                                         o  <-- D (data), the flight suddenly turns right
    */

    // Take data point if rotated angle between "new heading" (BC vector) and "local heading" (CD vector)
    // gets larger than certain threshold
    const previous = index > 0 && dataset[index - 1];
    if (
      previous && this.previousTaken &&
      previous !== this.previousTaken && // When B = C, go to the AB-BD rule below as they're exactly the same
      rotationExceedsThreshold(
        this.previousTaken, previous,
        previous, data,
      )
    ) {
      // Previous point should also be taken to avoid "smoothing out" information about the sharp angle at point C
      this._take(previous, 'local rotation exceeds threshold (restoring previous data point)');

      return this._take(data, 'local rotation exceeds threshold');
    }

    // Take data point if rotated angle between "previous heading" (AB vector) and "new heading" (BD vector)
    // gets larger than certain threshold
    if (
      this.previousTaken && this.previousTaken2 &&
      rotationExceedsThreshold(
        this.previousTaken2, this.previousTaken,
        this.previousTaken, data,
      )
    ) {
      return this._take(data, 'accumulative rotation exceeds threshold');
    }

    // Take data point that is 1 km far from previous one
    //
    // We put this rule at last because only the new Experimental aircraft (in Maverick DLC) can hit this rule
    // without hitting the other rules (with its 9 mach speed).
    if (distFromPreviousTaken >= MAXIMUM_DISTANCE_INTERVAL) {
      return this._take(data, 'distance from previous point exceeds threshold');
    }

    // Drop the data point
    return this._drop('no other rule is hit');
  },

  transform(input) {
    log(this.name, this._stats);
    return input;
  },

  _take(data, reason) {
    this.previousTaken2 = this.previousTaken;
    this.previousTaken = data;

    // Clear removal flag, this is to fix-and-take previous data point
    if (data._markedForRemoval) {
      data._markedForRemoval = false;
    }

    this._stat('taken', reason);
    return data;
  },

  _drop(reason) {
    this._stat('dropped', reason);
  },

  _stat(category, reason) {
    if (this._stats[category][reason]) {
      this._stats[category][reason]++;
    } else {
      this._stats[category][reason] = 1;
    }
  },

  _stats: { taken: {}, dropped: {} },
};

function rotationExceedsThreshold(from1, to1, from2, to2) {
  const vec1 = vector(cartesian(from1), cartesian(to1));
  const vec2 = vector(cartesian(from2), cartesian(to2));

  const rotation = angle(vec1, vec2);

  return rotation >= ROTATION_ANGLE_THRESHOLD;
}

// ---- Math helper functions below ----

function distance(from, to) {
  const vec = vector(cartesian(from), cartesian(to));
  return magnitude(vec);
}

/**
 * Transform { Longitude, Latitude, Altitude } coordinate into cartesian coordinate [x, y, z] in meters.
 */
function cartesian(data) {
  const { Longitude: lng, Latitude: lat, Altitude: alt } = data;

  const r = EARTH_RADIUS + alt;

  const x = r * Math.cos(rad(lng));
  const y = r * Math.sin(rad(lng));
  const z = r * Math.sin(rad(lat));

  return [x, y, z];
}

function vector(from, to) {
  return [
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2],
  ];
}

function angle(vec1, vec2) {
  const dotProduct = vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];

  const mag1 = magnitude(vec1);
  const mag2 = magnitude(vec2);

  if (mag1 < EPSILON || mag2 < EPSILON) {
    // Zero vectors have the same direction with any other vectors
    return 0;
  }

  return degrees(Math.acos(dotProduct / (mag1 * mag2)));
}

function magnitude(vec) {
  return Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2) + Math.pow(vec[2], 2));
}

function rad(degrees) {
  return degrees * Math.PI / 180;
}

function degrees(radians) {
  return radians * 180 / Math.PI;
}
