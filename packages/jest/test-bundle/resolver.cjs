module.exports = (path, options) => {
  // Use the default sync resolver from jest-resolve
  return options.defaultResolver(path, options);
};
