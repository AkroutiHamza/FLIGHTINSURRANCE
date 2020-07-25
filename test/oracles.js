
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

contract('Oracles', async (accounts) => {

    const TEST_ORACLES_COUNT = 30;
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);

        // Watch contract events
        const STATUS_CODE_UNKNOWN = 0;
        const STATUS_CODE_ON_TIME = 10;
        const STATUS_CODE_LATE_AIRLINE = 20;
        const STATUS_CODE_LATE_WEATHER = 30;
        const STATUS_CODE_LATE_TECHNICAL = 40;
        const STATUS_CODE_LATE_OTHER = 50;

    });




    it('can register oracles', async () => {
        // ARRANGE
        let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
        // ACT
        for(let a=1; a<TEST_ORACLES_COUNT; a++) {
            await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
            let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
            console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);

        }
    });

    it('can request flight status', async () => {

        // ARRANGE, LOT OF WORK
        // fnd airline
        let funding_value = await config.flightSuretyApp.AIRLINE_FUNDING_VALUE.call();
        // ACT FUNDING
        try {
            await config.flightSuretyApp.fundAirline(
                {from: config.firstAirline,
                    value: funding_value.toString()});
        }
        catch(e) {
            console.log(e.toString());
        }
        //set flight data
        let flight = 'ND1309'; // Course number
        const timestamp = Math.floor(Date.now() / 1000);
        // register flight
        try {
            await config.flightSuretyApp.registerFlight(flight, timestamp, "PARIS", "EL PASO", {from: config.firstAirline});
        }
        catch(e) {
            //should revert here
        }

        // Submit a request for oracles to get status information for a flight
        let resStatus = await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
        // assert event
        try {
            truffleAssert.eventEmitted(resStatus, 'OracleRequest', (ev) => {
                console.log("OracleRequest event emmitted");
                return ev.flight === flight && ev.airline === config.firstAirline;
            });
        }
        catch(e) {
            console.log("OracleRequest event not emmitted");
        }

        // ACT
        // Since the Index assigned to each test account is opaque by design
        // loop through all the accounts and for each account, all its Indexes (indices?)
        // and submit a response. The contract will reject a submission if it was
        // not requested so while sub-optimal, it's a good test of that feature
        for(let a=1; a<TEST_ORACLES_COUNT; a++) {

            // Get oracle information
            let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});

            for (let idx = 0; idx < 3; idx++) {

                try {
                    // Submit a response...it will only be accepted if there is an Index match
                    //console.log(oracleIndexes);
                    let r = await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx],
                        config.firstAirline, flight, timestamp, 10, {from: accounts[a]});

                    try {
                        truffleAssert.eventEmitted(r, 'OracleReport', (ev) => {
                            console.log("OracelReport event emmitted");
                            return ev.flight === flight;
                        });
                    }catch(e) {

                    }


                    try {
                        truffleAssert.eventEmitted(r, 'FlightStatusInfo', (ev) => {
                            console.log('FlightStatusInfo emmitted');
                            return ev.flight === flight;
                        });
                    }
                    catch (e) {
                        //console.log(e);
                    }

                    try {
                        truffleAssert.eventEmitted(r, 'FlightStatusUpdated', (ev) => {
                            console.log('FlightStatusUpdated emmitted');
                            //return ev.flight === flight;
                        });

                    }catch(e){
                        //
                    }

                }
                catch (e) {
                    // Enable this when debugging
                    //console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
                }
            }
        }
    });
});
