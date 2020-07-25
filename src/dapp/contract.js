import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];
        this.initWeb3();
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.airlines = [];
        this.passengers = [];
        this.flightsForPurchase = [];
        this.flightsLanded = [];
        this.initialize(callback);
        let self = this;
        // listen metamask accounts change and reload account
        window.ethereum.on('accountsChanged', function (accounts) {
            self.initialize(callback);
        })
    }

    initWeb3 = async (config) => {
        // Modern dapp browsers...
        if (window.ethereum) {
            this.web3 = new Web3(ethereum);
            try {
                // Request account access if needed
                await ethereum.enable();
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            this.web3 = new Web3(web3.currentProvider);
        }
        // Non-dapp browsers...
        else {
            this.web3 = new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'));
        }
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            if (accts) {
                this.account = accts[0];
                console.log(`Now using ${this.account} as default account.`);
            }
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: this.account}, callback);
    }

    getInsuranceCost(callback) {
        let self = this;
        self.flightSuretyApp.methods.INSURANCE_COST()
            .call(callback);
    }

    getFundingValue(callback) {
        let self = this;
        self.flightSuretyApp.methods.AIRLINE_FUNDING_VALUE()
            .call(callback);
    }

    pendingWithdrawals(callback) {
        let self = this;
            self.flightSuretyData.methods
                .pendingWithdrawals(this.account)
                .call(callback);
    }

    isFunded(callback) {
        let self = this;
        self.flightSuretyData.methods.isAirlineFunded(self.owner)
            .call(callback);
    }


    fundAirline(callback) {
        let self = this;
        console.log(self.airlines[0]);
        self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: this.account, value:
                self.web3.utils.toWei('10', 'ether'), gas:3000000}, callback);
    }

    registerAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.account}, callback);
    }

    registerFlight(flightNumber, departure, destination, callback) {
        let self = this;
        const timestamp = Math.floor(Date.now() / 1000);
        self.flightSuretyApp.methods
            .registerFlight(flightNumber, timestamp, departure, destination)
            .send({ from: this.account}, callback);
    }

    buyInsurance(airline, flight, timestamp, callback) {
        let self = this;
        (async() => {
            let insValue = await self.flightSuretyApp.methods.INSURANCE_COST().call();
            self.flightSuretyApp.methods
                .buyInsurance(airline, flight, timestamp)
                .send({ from: this.account, value: insValue.toString(), gas:3000000}, callback);
        })();

    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flight, timestamp)
            .send({ from: this.account}, (error, result) => {
                callback(error, result);
            });
    }

    pay(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .pay().send({ from: this.account, gas:3000000}, callback);
    }

    balance(callback) {
        let self = this;
        console.log(web3.eth.getBalance(self.flightSuretyData._address));
        callback;
        //elf.flightSuretyData.balance.call(callback);
    }
}