const nf = new Intl.NumberFormat('en-US');

module.exports = function formatNumber(number) {
  return nf.format(number);
};
