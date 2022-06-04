module.exports =  {
  name: 'toNumeric',

  transformEach(data) {
    Object.keys(data).forEach((attribute) => {
      data[attribute] = Number(data[attribute]);
    });

    // Feet to meters
    data.Altitude *= 0.3048;

    return data;
  },
};
