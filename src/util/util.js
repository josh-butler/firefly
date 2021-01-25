const pickBy = (obj, keys) => (
  keys.reduce((acc, val) => (obj[val] !== undefined ? { ...acc, [val]: obj[val] } : acc), {})
);

module.exports = {
  pickBy,
};
