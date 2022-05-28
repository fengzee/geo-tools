/**
 * Transformer protocol:
 * 
 * {
 *   transformEach(data, index, dataset) {
 *     return <transformed data, or null / undefined for removing the data point>;
 *   },
 *   transform(dataset) {
 *     return <transformed - new dataset, morePasses: boolean - true to require more passes>;
 *   }
 * }
 */
module.exports = [
  // Remove unused attributes in each data point
  require('./evictUnusedAttributes.js'),

  // Transform string values to numerics and convert units (feet to meters)
  require('./numerify.js'),

  // Remove redundant data points to form a smooth and simple path curve
  require('./simplifyCurve.js'),

  // Transform the whole dataset into a Google Earth compliant KML format
  require('./toGoogleEarthKml.js'),
];
