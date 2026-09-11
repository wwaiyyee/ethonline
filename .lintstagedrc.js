const path = require("path");

const buildNextEslintCommand = (filenames) => {
  const relativeFiles = filenames
    .map((f) => path.relative("packages/nextjs", f).replace(/\\/g, "/"))
    .join(" ");
  return `sh -c "cd packages/nextjs && ./node_modules/.bin/next lint --fix --file ${relativeFiles}"`;
};

const checkTypesNextCommand = () => "yarn next:check-types";

const buildHardhatEslintCommand = (filenames) => {
  const relativeFiles = filenames
    .map((f) => path.relative("packages/hardhat", f).replace(/\\/g, "/"))
    .join(" ");
  return `yarn hardhat:lint-staged --fix ${relativeFiles}`;
};

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
  ],
  "packages/hardhat/**/*.{ts,tsx}": [buildHardhatEslintCommand],
};
