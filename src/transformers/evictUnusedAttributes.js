module.exports =  {
  name: 'evictUnusedAttributes',

  keepAttributes: [
    'Milliseconds',
    'Latitude',
    'Longitude',
    'Altitude',
  ],

  transformEach(data) {
    Object.keys(data).forEach((originalAttribute) => {
      if (
        !originalAttribute.startsWith('_') && // Reserved attributes (e.g. _markedForRemoval)
        !this.keepAttributes.includes(originalAttribute)
      ) {
        delete data[originalAttribute];
      }
    });
    return data;
  },
};
