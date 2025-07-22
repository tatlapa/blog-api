// Configuration globale pour les tests
require("dotenv").config({ path: "./config.env" });

// Augmenter le timeout pour les tests
jest.setTimeout(10000);

// Supprimer les logs console pendant les tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
