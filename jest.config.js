// jest.config.js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
    transform: {
      "^.+\\.(ts|tsx)$": "ts-jest",
    },
    transformIgnorePatterns: ["/node_modules/"],
    setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],
  };
  