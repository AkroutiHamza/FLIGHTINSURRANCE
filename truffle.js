var HDWalletProvider = require("truffle-hdwallet-provider");
// update to your seed
var mnemonic =
  "cabbage carpet reject power doctor public abandon behave asthma rose pretty marine";

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id,
      accounts: 50, // looks useless, set it inside Ganache AppImage settings => Accounts / Keys
    },
    // add develop as well as on my local machine
    // truffle dev network is named "develop",
    // not "development"
    develop: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 50);
      },
      network_id: "*",
      gas: 9999999,
      accounts: 50,
    },
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 50);
      },
      network_id: "*",
      gas: 9999999,
      accounts: 50,
    },
  },
  compilers: {
    solc: {
      version: "^0.5.6",
    },
  },
};
