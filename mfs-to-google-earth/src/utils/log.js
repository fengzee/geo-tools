const start = Date.now();

module.exports = function log(tag, message, more) {
  const time = Date.now() - start;
  const prefix = `${time} ms | [${tag}]`;
  if (more) {
    console.log(prefix, message, more);
  } else {
    console.log(prefix, message);
  }
};
