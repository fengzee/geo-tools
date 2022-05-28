module.exports = function parse(csv) {
  const lines = csv.split('\r\n');
  const columns = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const item = {};
    line.split(',').forEach((entry, index) => {
      item[columns[index]] = entry;
    });
    return item;
  });
};
