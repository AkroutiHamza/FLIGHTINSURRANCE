import DOM from './dom';
import Contract from './contract';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'startbootstrap-agency/vendor/bootstrap/css/bootstrap.css';
import 'startbootstrap-agency/css/agency.min.css';
import './css/agency.min.css';
import './css/app.css';
import 'startbootstrap-agency/vendor/bootstrap/js/bootstrap.min.js';
import './js/agency.js';
import Web3 from 'web3';
const web3 = new Web3(); // utils conversion tool needed here ....


(async() => {

    let result = null;

    function getFlights() {
        (async() => {
            console.log('updating flights ....');
            try {
                let response = await fetch('http://localhost:3000/flights');
                let flights = await response.json();
                $("#flightsPurchase").find('option').remove();
                for (let i=0; i < flights.flightsForPurchase.length; i++) {
                    let flight = flights.flightsForPurchase[i];
                    $("#flightsPurchase").append(
                        new Option(`${flight.flight} ${flight.departure}/${flight.destination}`,
                            `${flight.airline}-${flight.flight}-${flight.timestamp}`));
                }
                $("#ftc-events").find('li').remove();
                for (let i=0; i < flights.flightsLanded.length; i++) {
                    let flight = flights.flightsLanded[i];
                    $("#ftc-events").prepend(`<li class="m-auto">${flight.flight} ${flight.departure}/${flight.destination} ${flight.status_code}</li>`);
                }
                $("#ftc-events").prepend('<li><h6 class="text-center">LANDED FLIGHTS</h6></li>');
            }catch(e) {
                console.log(e);
            }
        })();
    }
    getFlights();

    let contract = new Contract('localhost', () => {
        // Read transaction
        contract.isOperational((error, result) => {
            if (error) {
                console.log(error);
                $('button').attr('disabled', true);
            } else {
                $('button').removeAttr('disabled');
            }
            let appStatus = $("#operational");
            const ml = error ? '<div class="led-box"><div class="led-red"></div>' : '<div class="led-box"><div class="led-green"></div>';
            appStatus.html(ml);
        });

        contract.getFundingValue((error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    let fundingValue = $("#fundingPrice");
                    const price = web3.utils.fromWei(result, 'ether');
                    fundingValue.html(price);
                }
                catch (e) {
                    console.log(e)
                }
            }
        });

        contract.getInsuranceCost((error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    let insPrice = $("#insPrice");
                    const price = web3.utils.fromWei(result, 'ether');
                    insPrice.html(price);
                }
                catch(e) {
                    console.log(e)
                }
            }
        });

        function getBalance() {
            contract.pendingWithdrawals((error, result) => {
                let price = 0;
                if (error) {
                    console.log(error);
                }else{
                    try {
                        price = web3.utils.fromWei(result, 'ether');
                    } catch(e) {
                        console.log(e);
                    }
                }
                let claimAmount = $("#claimAmount");
                claimAmount.html(price);
            });
        }

        getBalance();



        DOM.elid('registerAirline').addEventListener('click', () => {
            const airline = $("#newAirline").val();
            if (airline) {
                contract.registerAirline(airline, (error, result) => {
                    console.log(error, result);
                });
            } else {
                alert("You need to insert an airline address");
            }

        });

        DOM.elid('fundAirline').addEventListener('click', () => {
            contract.fundAirline((error, result) => {
                console.log(error, result);
            });
        });

        DOM.elid('registerFlight').addEventListener('click', () => {
            const flightNumber = $("#flightNumber").val();
            const departure = $("#departure").val();
            const destination = $("#destination").val();
            if (flightNumber && departure && destination) {
                contract.registerFlight(flightNumber, departure, destination, (error, result) => {
                    console.log(error, result);
                });
            } else {
                alert("Make sure to insert a flight number, departure and destination");
            }
        });

        DOM.elid('purchaseForFlight').addEventListener('click', () => {
            try {
                let data = $("#flightsPurchase").val().split('-');
                if (data.length === 3) {
                    contract.buyInsurance(data[0], data[1], data[2], (error, result) => {
                        console.log(error, result);
                     });
                }
            }catch(e){
                console.log("Invalid data");
            }
        });

        DOM.elid('updateFlightsList').addEventListener('click', () => {
            console.log('reloading flights list');
            getFlights();
        });

        DOM.elid('claim').addEventListener('click', () => {
            let self = this;
            contract.pay((error, result) => {
                console.log(error, result);
                getBalance();
            });
        });

        DOM.elid('balance').addEventListener('click', () => {
            getBalance();
        })


        DOM.elid('statusForFlight').addEventListener('click', () => {
            try {
                let data = $("#flightsPurchase").val().split('-');
                if (data.length === 3) {
                    contract.fetchFlightStatus(data[0], data[1], data[2], (error, result) => {
                        console.log(error, result);
                    });
                }
            }catch(e){
                console.log("Invalid data");
            }
        });
    });

})();







