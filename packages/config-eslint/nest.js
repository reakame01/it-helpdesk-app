/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...require("./base"),
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  rules: {
    ...require("./base").rules,
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
