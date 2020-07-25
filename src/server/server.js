import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
const bodyParser = require("body-parser");
const cors = require('cors');
require("babel-polyfill");
/*import 'core-js/shim';
import 'regenerator-runtime/runtime';*/

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
const accounts = web3.eth.getAccounts();
web3.eth.defaultAccount = "0xE58d0BD823112817532e2687818116f64C648868"; //web3.eth.accounts[0];
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);


class ContractsServer  {

    constructor () {
        this.flightsForPurchase = [];
        this.flightsLanded = [];
        this.oracles = [];
        // add 20 for every entry if you want to test it
        // and do not have the willing to wait your luck
        this.status = [20,30,40,50,0];
    }

    init = async () => {
        // add App contract as authorizedCaller
        // to data contract
        try {
            const address = flightSuretyApp._address;
            const accs = await accounts;
            await flightSuretyData.methods.authorizeCaller(address).send({from: accs[0]});
        } catch(err) {
           console.log(err.toString());
           console.error('\x1b[31m Check that Ganache is running and that your config contracts ' +
               'are correctly deployed.');
           process.exit();
        }
        this.registerOracles();
        this.listenEvents();
        this.getRegisteredFlights();
    }

    registerOracles = async () => {
        // registering oracles
        let self = this;
        const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
        const accs = await accounts;
        // lowest number of total accounts or config.numOracles
        const numOracles = config.numOracles < accs.length
            ? config.numOracles : (accs.length -1)
        // registration loop, starts from 1 to skip contract owner
        for (var i = 1; i < numOracles; i++) {
            try {
                self.oracles.push(accs[i]);
                await flightSuretyApp.methods.registerOracle().send({
                    from: accs[i], value: fee, gas:3000000 //VM errors with no gas
                });
            } catch (err) {
                console.log(err.toString());
            }
        }
    }

    submitOracleResponse = async(airline, flight, timestamp) => {
        let self = this;
        for (let i = 0; i < self.oracles.length; i++) {
            const statusCode = self.status[Math.floor(Math.random() * self.status.length)];
            try {
                let idxs = await flightSuretyApp.methods.getMyIndexes().call({from: self.oracles[i]});
                for (let y = 0; y < idxs.length; y++) {
                    try {
                        await flightSuretyApp.methods
                            .submitOracleResponse(idxs[y], airline, flight, timestamp, statusCode)
                            .send({ from: self.oracles[i], gas:3000000}); // error with no gas
                    } catch (error) {
                        // do not log unless
                        console.log(error.toString());
                        //console.log(error);
                    }
                }
            } catch(error) {
                console.log(error);
            }
        }
    }

    getRegisteredFlights = async () => {
        let self = this;
        const numRegisteredFlights =
            await flightSuretyData.methods.numRegisteredFlights().call();
        console.log(`${numRegisteredFlights} registered flights`);
        // reset flights list
        self.flightsForPurchase = [];
        self.flightsLanded = [];
        for (let i=0; i < parseInt(numRegisteredFlights); i++) {
            try {
                let flightKey = await flightSuretyData.methods.getFlightKeyByIndex(i).call();
                let flight = await flightSuretyData.methods.flights(flightKey).call();
                flight.flightKey = flightKey;
                if (flight.status_code === "0") {
                    self.flightsForPurchase.push(flight);
                }else{
                    self.flightsLanded.push(flight);
                }
            } catch(e) {
                console.log(e);
            }
        }
    }

    listenEvents = async () => {

        let self = this;

        flightSuretyApp.events.OracleReport({}, function (error, event) {
            if (error) console.log(error)
            console.log('OracleReport:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyApp.events.OracleRequest({}, async (error, event) => {
            if (error) console.log(error)
            console.log('OracleRequest:');
            console.log(event.returnValues);
            console.log('-------------------');
            // get the data
            const {airline, flight, timestamp} = event.returnValues;
            await self.submitOracleResponse(airline, flight, timestamp);
        });

        flightSuretyApp.events.FlightStatusInfo({}, function (error, event) {
            if (error) console.log(error)
            console.log('FlightStatusInfo:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyData.events.AirlineFunded({}, function (error, event) {
            if (error) console.log(error)
            console.log('AirlineFunded:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyData.events.AirlineRegistered({}, function (error, event) {
            if (error) console.log(error)
            console.log('AirlineRegistered:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyData.events.FlightRegistered({}, function (error, event) {
            if (error) console.log(error);
            console.log('FlightRegistered:');
            console.log(event.returnValues);
            console.log('-------------------');
            self.getRegisteredFlights();
        });


        flightSuretyData.events.PassengerInsured({}, function (error, event) {
            if (error) console.log(error);
            console.log('PassengerInsured:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyData.events.FlightStatusUpdated({}, function (error, event) {
            if (error) console.log(error);
            console.log('FlightStatusUpdated:');
            console.log(event.returnValues);
            console.log('-------------------');
            self.getRegisteredFlights();
        });

        flightSuretyData.events.PassengerCredited({}, function (error, event) {
            if (error) console.log(error);
            console.log('PassengerCredited:');
            console.log(event.returnValues);
            console.log('-------------------');
        });

        flightSuretyData.events.AccountWithdrawal({}, function (error, event) {
            if (error) console.log(error);
            console.log('AccountWithdrawal:');
            console.log(event.returnValues);
            console.log('-------------------');
        });
    }
}


class FlightSuretyServer {

    constructor(constractsServer) {
        this.app = express();
        this.contractServer = contractsServer;
        this.initExpressMiddleWare();
        this.getInfo();
        this.getFlights();
        this.initControllers();
    }

    initControllers() {
        require("./controllers/ErrorController.js")(this.app);
    }

    initExpressMiddleWare() {
        this.app.use(bodyParser.urlencoded({extended:true}));
        this.app.use(bodyParser.json());
        this.app.use(cors());
    }

    getFlights() {
        this.app.get("/flights", async (req, res) => {
            await this.contractServer.getRegisteredFlights();
            //this.contractServer.getRegisteredFlights();
            res.json({
                flightsForPurchase: this.contractServer.flightsForPurchase,
                flightsLanded: this.contractServer.flightsLanded
            });
        })
    }

    getInfo() {
        this.app.get("/", (req, res) => {
            res.json({
                endpoints: [
                    {
                        "/": {
                            method: "GET",
                            description: `An API for use with your Dapp`
                        },
                        "/flights": {
                            method: "GET",
                            description: `List of flights`
                        }
                    }
                ]
            })
        });
    }
}

const contractsServer = new ContractsServer();
contractsServer.init();
const app = new FlightSuretyServer(contractsServer);
export default app;


