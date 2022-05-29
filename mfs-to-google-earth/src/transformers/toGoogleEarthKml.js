const fs = require('fs');
const path = require('path');

const KML_TEMPLATE_PATH = '../../templates/kmlTemplate.kml';

module.exports = {
  name: 'toGoogleEarthKml',

  transform(input) {
    const { meta: { inputFile }, dataset } = input;
    const coordinates = dataset.map((data) => {
      return [
        data.Longitude,
        data.Latitude,
        data.Altitude,
      ].join(',');
    }).join(' ');
    return { meta: { inputFile }, dataset: kml(coordinates, inputFile) };
  },
};

function kml(coordinates, inputFile) {
  const template = fs.readFileSync(path.resolve(__dirname, KML_TEMPLATE_PATH));

  const name = inputFile.split('.').slice(0, -1).join('.');
  return template.toString()
    .replace('__DOCUMENT_NAME__', `${name}.kml`)
    .replace('__PATH_NAME__', name)
    .replace('__COORDINATES__', coordinates);
}
