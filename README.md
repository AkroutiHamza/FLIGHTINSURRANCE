# FLIGHTINSURRANCE

An Ethereum distributed app that manages insurance for travelers 🧑‍✈️ 

[![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)](https://github.com/AkroutiHamza) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat&logo=github)](https://github.com/AkroutiHamza/Hamza-Akrouti)


![DApp screenshot](src/dapp/img/dapp.png?raw=true "Flight Surety DApp")

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.<br />
<br />
__Notes:__ The project has been tested with __Truffle v5.0.4__, __Solidity 0.5.6__<br />
__

##### To install, download or clone the repo, then:

1. `npm install`
2. `truffle compile`
3. `truffle migrate --reset --network ganache --firstAirline=FIRST_AIRLINE_ADDRESS --numOracles=NUM_OF_ORACLES`<br />
4. `npm run server` <br />
    __Warning__: Start the server first because the data contract auhtorization call is made from the server
5. `npm run dapp` <br />
    The DApp is runing at `http://localhost:8000`

## Testing

##### To run truffle tests:
1. Update the mnemonic in truffle.js with your key seed.
2. `truffle dev`
3. `migrate --reset`
4. `test`

##### Feature of the tests:
1. Check the operational status of the contracts;
2. Funding or ailine;
3. Register airlines with the multiparty threshold;
4. Flight registration by airline;
5. Passenger purchase of insurance;
6. Check Oracles registration;
7. Watch for FlightStusInfo event;


## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Using the DApp

Using the DApp is straightforward. Start Metamask, clear the history and use the address of the first ailine. <br />
##### You can then: 
1. send fund; 
2. register flights, 
3. update the flights lists
4. purchase insurance for a spcific flight, 
5. update the flight status of a specific flight,
6. check your balance
7. claim your insurance payout


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)


⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
----
```javascript

if (_.isAwesome(thisRepo)) {
  thisRepo.star(); // thanks in advance :p
}

```
----

