var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var web3 = require('web3');
const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
    describe('(operational status) Contracts Operational Status', function(){
        it(`(caller) is not authorized`, async function () {

            // Get operating status
            let status = await config.flightSuretyData.isAuth.call(config.flightSuretyApp.address);

            assert.equal(status, true, "Incorrect value for auth user.");

        });

        it(`(contract) has correct initial isOperational() value`, async function () {

            // Get operating status
            let status = await config.flightSuretyData.isOperational.call();

            assert.equal(status, true, "Incorrect initial operating status value");

        });

        it(`(contract) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

            // Ensure that access is denied for non-Contract Owner account
            let accessDenied = false;
            try
            {
                await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
            }
            catch(e) {
                accessDenied = true;
            }
            assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

        });

        it(`(contract) can allow access to setOperatingStatus() for Contract Owner account`,
            async function () {

                // Ensure that access is allowed for Contract Owner account
                let accessDenied = false;
                try
                {
                    await config.flightSuretyData.setOperatingStatus(false);
                }
                catch(e) {
                    accessDenied = true;
                }
                assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

            });

        it(`(contract) can block access to functions using requireIsOperational when operating status is false`,
            async function () {

                await config.flightSuretyData.setOperatingStatus(false);

                let reverted = false;
                try
                {
                    await config.flightSurety.setTestingMode(true);
                }
                catch(e) {
                    reverted = true;
                }
                assert.equal(reverted, true, "Access not blocked for requireIsOperational");

                // Set it back for other tests to work
                await config.flightSuretyData.setOperatingStatus(true);

            });
    });


    describe('(airline) Airlines registration', function(){

        // ARRANGE
        let newAirline = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];
        let airline5 = accounts[5];

        it('(registered airline) can deposit fund', async () => {
            // get the funding value
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
            let result = await config.flightSuretyData.isAirlineFunded(config.firstAirline);

            // ASSERT
            assert.equal(result, true, "Airline hasn't yet provided funding");

        });

        it('(funded airline) can register an Airline using registerAirline() if number of funded airlines is below treshold', async () => {


            // ACT
            try {
                await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
            }
            catch(e) {
                console.log(e.toString());
            }
            let result = await config.flightSuretyData.isAirlineRegistered(newAirline);

            // ASSERT
            assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");

        });

        //check if up to 4 airlines can registered before treshold kicks in

        it('(4 airlines) can be registered before theshold kicks in', async () => {
            // ARRANGE
            let result = undefined;

            // ACT
            try {
                await config.flightSuretyApp.registerAirline(airline3, {from: config.firstAirline});
            }
            catch(e) {
            }
            let result3 = await config.flightSuretyData.isAirlineRegistered(airline3);
            // ASSERT
            assert.equal(result3, true, "Third airline should be able to be registered");

            // ACT
            try {
                await config.flightSuretyApp.registerAirline(airline4, {from: config.firstAirline});
            }
            catch(e) {
            }
            let result4 = await config.flightSuretyData.isAirlineRegistered(airline4);
            // ASSERT
            assert.equal(result4, true, "Fourth airline should be able to be registered");
        });


        it('(5th airline) cannot be registered without multiparty consensus', async () => {
            // ARRANGE
            let result = undefined;

            // ACT
            try {
                await config.flightSuretyApp.registerAirline(airline5, {from: config.firstAirline});
            }
            catch(e) {
                // should revert
            }
            let result5 = await config.flightSuretyData.isAirlineRegistered(airline5);;
            // ASSERT
            assert.equal(result5, false, "Fifth airline should not be able to be registered without passing the treshold");
        });


        it('(airline) cannot register another airline that is already registered', async () => {

            // ARRANGE
            let result = undefined;

            // ACT
            try {
                result = await config.flightSuretyApp.registerAirline(newAirline);
            }
            catch(e) {
                //should revert here
                result = false;
            }
            // ASSERT
            assert.equal(result, false, "Airline should not be able to register an already registered airline");
        });


        it('(airline) can be register using the multiparty consensus', async () => {

            // ARRANGE
            let funding_value = await config.flightSuretyApp.AIRLINE_FUNDING_VALUE.call();

            // ACT -- let airline fund themselves
            // should check also that extra value is returned to the sender
            try {
                await config.flightSuretyApp.fundAirline({from: newAirline, value: funding_value.toString()});
                await config.flightSuretyApp.fundAirline({from: airline3, value: funding_value.toString()});
                await config.flightSuretyApp.fundAirline({from: airline4, value: funding_value.toString()});
            }
            catch(e) {
                //
            }

            try {
                await config.flightSuretyApp.registerAirline(airline5, {from: newAirline});
            }
            catch(e) {

            }

            // check if airline can register twice the same airline
            let resDuplicate = undefined;
            try {
                resDuplicate = await config.flightSuretyApp.registerAirline(airline5, {from: newAirline});
            }
            catch(e) {
                // should revert
                resDuplicate = false;
            }

            assert.equal(resDuplicate, false, "A registered airline should not be able to register twice the same airline.");

            try {
                await config.flightSuretyApp.registerAirline(airline5, {from: airline3});
            }
            catch(e) {

            }

            let result = await config.flightSuretyData.isAirlineRegistered(airline5);

            // ASSERT
            assert.equal(result, true, "Fifth airline should now be registered using multiparty consensus.");

        });
    });

    describe('(airline) flight registration', function(){
        const timestamp = Math.floor(Date.now() / 1000);
        it('(airline) cannot register a flight if it is not funded', async () => {

            // ARRANGE
            let result = undefined;
            let airline = accounts[5];

            // ACT
            try {
                result = await config.flightSuretyApp.registerFlight("AF001", timestamp, "PARIS", "EL PASO", {from: airline});
            }
            catch(e) {
                //should revert here
                result = false;
            }
            // ASSERT
            assert.equal(result, false, "Airline should not be able to register a flight if it is not funded");
        });
        it('(airline) can register a flight if it is funded', async () => {

            // ARRANGE
            let result = undefined;

            // ACT
            try {
                await config.flightSuretyApp.registerFlight("AF001", timestamp,
                    "PARIS", "EL PASO", {from: config.firstAirline});
                result = await config.flightSuretyApp.isFlightRegistered(config.firstAirline, "AF001", timestamp);
            }
            catch(e) {
                //
            }
            // assert
            assert.equal(result, true, "Airline should be able to register a flight if it is funded");
        });
        it('(airline) cannot register a flight that is already registered', async () => {

            // ARRANGE
            let result = undefined;

            // ACT
            try {
                result = await config.flightSuretyApp.registerFlight("AF001", timestamp,
                    "PARIS", "EL PASO", {from: config.firstAirline});
            }
            catch(e) {
                //
                result = false;
            }
            // assert
            assert.equal(result, false, "Airline should not be able to register a flight that is already registered");
        });
    });

    describe('(passenger) flight insurance', function(){

        const timestamp = Math.floor(Date.now() / 1000);
        const passenger1 = accounts[10];
        const passenger2 = accounts[11];

        it('(passenger) cannot buy an insurance for an unregistered flight', async () => {

            // ARRANGE
            let result = undefined;

            // ACT
            try {
                result = await config.flightSuretyApp.buyInsurance(config.firstAirline, "AF002", timestamp,
                    {from: passenger1, value: web3.utils.toWei('1', 'ether') });
            }
            catch(e) {
                //
            }
            // check
            result = await config.flightSuretyApp.isPassengerInsuredForFlight(config.firstAirline,
                "AF002", timestamp, passenger1);
            // assert
            assert.equal(result, false, "Passenger should not be able to buy insurance for a flight that is not registered");
        });


        it('(passenger) can buy an insurance for a registered flight that is not landed', async () => {

            // ARRANGE
            let result = undefined;

            try {
                await config.flightSuretyApp.registerFlight("AF002", timestamp,
                    "LONDON", "EL PASO", {from: config.firstAirline});
            }
            catch(e) {
                //
                console.log(e.toString());
            }

            // ACT
            try {
                await config.flightSuretyApp.buyInsurance(config.firstAirline, "AF002", timestamp,
                    {from: passenger1, value: web3.utils.toWei('1', 'ether')});
            }
            catch(e) {
                //
            }
            // check
            result = await config.flightSuretyApp.isPassengerInsuredForFlight(config.firstAirline,
                "AF002", timestamp, passenger1);
            // assert
            assert.equal(result, true, "Passenger should be able to buy insurance for a registered flight that is not landed");
        });

        it('(passenger) cannot buy twice an insurance for the same registered flight', async () => {

            // ARRANGE
            let result = undefined;

            // ACT
            try {

                result = await config.flightSuretyApp.buyInsurance(config.firstAirline, "AF002", timestamp,
                    {from: passenger1, value: web3.utils.toWei('1', 'ether')});
            }
            catch(e) {
                // should revert
                result = false;
            }
            // check
            /*result = await config.flightSuretyApp.isPassengerInsuredForFlight(config.firstAirline,
                "AF002", timestamp, passenger1);*/
            // assert
            assert.equal(result, false, "Passenger should not be able to buy twice an insurance for the same registered flight");
        });
    });

});

// test ./test/flightSurety.js