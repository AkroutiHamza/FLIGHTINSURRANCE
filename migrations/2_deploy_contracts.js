const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), {string: ['firstAirline']});

module.exports = function(deployer) {
    let firstAirline, numOracles;
    try {
        firstAirline = argv['firstAirline']
            ? argv['firstAirline']
            // Update the default first airline here with your truffle dev accounts[1]
            // for convenience when running test in truffle dev
            : '0xce3bf475bf23d016ce87c3b49552d03ed66eca34';
        numOracles = argv['numOracles']
            ? argv['numOracles']
            // Update the default first airline here with your truffle dev accounts[1]
            // for convenience when running test in truffle dev
            : 20;
    }catch(e) {
        console.log(e);
    }
    console.log(firstAirline);
    deployer.deploy(FlightSuretyData, firstAirline)
    .then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://127.0.0.1:7545',//updated to Ganache AppImage port
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address,
                            numOracles: 50, // change to increase the number of oracles
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}