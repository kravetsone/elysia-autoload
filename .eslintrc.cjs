const { configure, presets } = require("eslint-kit");

module.exports = configure({
  extend: {
    rules: {
      "import/no-anonymous-default-export": "off",
      "import/no-default-export": "off",
    },
  },
  presets: [
    presets.imports(),
    presets.typescript(),
    presets.prettier(),
    presets.node(),
  ],
});
