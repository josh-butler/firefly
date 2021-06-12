const KSUID = require('ksuid');

const pickBy = (obj, keys) => (
  keys.reduce((acc, val) => (obj[val] !== undefined ? { ...acc, [val]: obj[val] } : acc), {})
);

const ksuid = () => {
  const id = KSUID.randomSync();
  return id.string;
};

module.exports = {
  pickBy,
  ksuid,
};
