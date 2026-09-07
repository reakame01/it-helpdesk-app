/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "prettier"],
  ignorePatterns: ["node_modules/", "dist/", ".next/", "coverage/"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "react/react-in-jsx-scope": "off",
  },
};
