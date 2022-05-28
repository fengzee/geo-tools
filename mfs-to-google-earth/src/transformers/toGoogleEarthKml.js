const fs = require('fs');
const path = require('path');

const KML_TEMPLATE_PATH = '../../templates/kmlTemplate.kml';

module.exports = {
  name: 'toGoogleEarthKml',

  transform(dataset) {
    const coordinates = dataset.map((data) => {
      return [
        data.Longitude,
        data.Latitude,
        data.Altitude,
      ].join(',');
    }).join(' ');
    return kml(coordinates);
  },
};

function kml(coordinates) {
  const template = fs.readFileSync(path.resolve(__dirname, KML_TEMPLATE_PATH));
  return template.toString()
    .replace('__DOCUMENT_NAME__', 'Flight Path.kml')
    .replace('__PATH_NAME__', 'Flight Path')
    .replace('__COORDINATES__', coordinates);
}
