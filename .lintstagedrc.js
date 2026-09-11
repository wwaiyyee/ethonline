const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `cd packages/nextjs && yarn eslint --fix ${filenames
    .map((f) => path.relative(path.join("packages", "nextjs"), f).replace(/\\/g, "/"))
    .join(" ")}`;

const checkTypesNextCommand = () => "yarn next:check-types";

const buildHardhatEslintCommand = (filenames) =>
  `yarn hardhat:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "hardhat"), f).replace(/\\/g, "/"))
    .join(" ")}`;

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
  ],
  "packages/hardhat/**/*.{ts,tsx}": [buildHardhatEslintCommand],
};
