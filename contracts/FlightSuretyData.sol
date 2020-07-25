pragma solidity ^0.5.6;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // contract
    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedCallers;

    // airlines
    struct Airline {
        bool isRegistered;
        bool isFunded;
    }
    mapping(address => Airline) public airlines;
    uint256 public numRegisteredAirlines;

    // flights
    struct Flight {
        bool isRegistered;
        address airline;
        string flight;
        string departure;
        string destination;
        uint timestamp;
        uint8 status_code; // if greater than 0 then it is landed
    }
    mapping (bytes32 => Flight) public flights;
    bytes32[] public registeredFlights;

    // insurance
    struct InsuredData {
        address passenger;
        // used to decouple insurance price
        // and multiplier from data contract
        uint256 amount;
        uint256 multiplier;
        bool credited;
    }
    mapping (bytes32 => InsuredData[]) flightInsuredPassengers;

    // needed for withdrawal pattern
    mapping (address => uint) public pendingWithdrawals;




    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address _airline);
    event AirlineFunded(address _airline);
    event FlightRegistered(bytes32 _flightKey);
    event PassengerInsured(bytes32 _flightKey, address _passenger);
    event FlightStatusUpdated(bytes32 _flightKey, uint8 _statusCode);
    event PassengerCredited(address _passenger, uint256 _amount);
    event AccountWithdrawal(address _address, uint256 _amount);



    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor (address _airline)
    public
    payable
    {
        contractOwner = msg.sender;
        airlines[_airline] = Airline(true, false);
        numRegisteredAirlines = 1;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized()
    {
        require(authorizedCallers[msg.sender] == true, "Caller is not auhtorized");
        _;
    }

    //check if airline is registered
    modifier requireIsAirlineRegistered(address _airline)
    {
        require(airlines[_airline].isRegistered, "Airline is not registered");
        _;
    }

    //check if airline is funded
    modifier requireIsAirlineFunded(address _airline)
    {
        require(airlines[_airline].isRegistered, "Airline is not funded");
        _;
    }


    modifier checkValue(uint256 _price) {
        _;
        uint amountToReturn = msg.value - _price;
        msg.sender.transfer(amountToReturn);
    }

    modifier requireFlightRegistered(bytes32 _flightKey) {
        require(flights[_flightKey].isRegistered == true, "Flight is not registered");
        _;
    }

    modifier requireFlightNotYetRegistered(bytes32 _flightKey) {
        require(!flights[_flightKey].isRegistered, "Flight is already registered");
        _;
    }

    modifier requireIsFlightNotLanded(bytes32 _flightKey) {
        require(flights[_flightKey].status_code == 0, "Flight has already landed");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function getFlightKeyByIndex(uint idx)
    public
    view
    returns (bytes32)
    {
        return registeredFlights[idx];
    }


    function numRegisteredFlights()
    public
    view
    returns (uint)
    {
        return registeredFlights.length;
    }

    function isFlightLanded(bytes32 _flightKey)
    public
    view
    returns (bool)
    {
        return flights[_flightKey].status_code > 0;
    }

    function isFlightRegistered(bytes32 _flightKey)
    public
    view
    returns (bool)
    {
        return flights[_flightKey].isRegistered;
    }


    function isPassengerInsuredForFlight(bytes32 _flightKey, address _passenger)
    external
    view
    returns (bool)
    {
        InsuredData[] memory insuredPassengers = flightInsuredPassengers[_flightKey];
        for(uint i = 0; i < insuredPassengers.length; i++) {
            if (insuredPassengers[i].passenger == _passenger) {
                return true;
            }
        }
        return false;
    }

    function isAuth(address _address)
    public
    view
    returns (bool)
    {
        return authorizedCallers[_address];
    }

    function getNumRegisteredAirlines()
    public
    view
    returns (uint256)
    {
        return numRegisteredAirlines;
    }


    /**
    * @dev Get funding status of an airline
    *
    * @return A bool that is the airline isFunded status
    */
    function isAirlineFunded(address _airline)
    public
    view
    returns(bool)
    {
        return airlines[_airline].isFunded;
    }

    /**
   * @dev Get registered status of an airline
   *
   * @return A bool that is the airline isRegistered status
   */
    function isAirlineRegistered(address _airline)
    public
    view
    returns(bool)
    {
        return airlines[_airline].isRegistered;
    }


    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function authorizeCaller
    (
        address _contractAddress
    )
    external
    requireContractOwner
    {
        authorizedCallers[_contractAddress] = true;
    }

    function deauthorizeCaller
    (
        address _contractAddress
    )
    external
    requireContractOwner
    {
        delete authorizedCallers[_contractAddress];
    }



    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function fundAirline(address _airline)
    payable
    external
    requireIsOperational
    requireIsCallerAuthorized
    {
        airlines[_airline].isFunded = true;
        emit AirlineFunded(_airline);
    }

    function registerAirline (address _newAirline, address _registeringAirline)
    external
    requireIsOperational
    requireIsCallerAuthorized
    requireIsAirlineFunded(_registeringAirline)
    {
        airlines[_newAirline] = Airline(true, false);
        numRegisteredAirlines = numRegisteredAirlines + 1;
        emit AirlineRegistered(_newAirline);
    }

    function registerFlight
    (
        bytes32 _flightKey,
        address _airline,
        string memory _flight,
        uint256 _timestamp,
        string memory _departure,
        string memory _destination
    )
    public
    payable
    requireIsOperational
    requireIsCallerAuthorized
    requireIsAirlineFunded(_airline)
    requireFlightNotYetRegistered(_flightKey)
    {
        flights[_flightKey] = Flight(
            true,
            _airline,
            _flight,
            _departure,
            _destination,
            _timestamp,
            0
        );
        registeredFlights.push(_flightKey);
        emit FlightRegistered(_flightKey);
    }

    function updateFlightStatus(bytes32 _flightKey, uint8 _statusCode)
    external
    requireIsOperational
    requireIsCallerAuthorized
    {
        // check if the flight has landed gracefully without reverting
        if (flights[_flightKey].status_code == 0) {
            flights[_flightKey].status_code = _statusCode;
            if (_statusCode == 20) {
                creditInsurees(_flightKey);
            }
        }
        emit FlightStatusUpdated(_flightKey, _statusCode);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
    (
        bytes32 _flightKey,
        address _passenger,
        uint256 _amount,
        uint256 _multiplier)
    external
    requireIsOperational
    requireIsCallerAuthorized
    requireFlightRegistered(_flightKey) //
    // we should have a proper mechanism to decide if the insurance can still be purchased
    // but for now this will suffice
    requireIsFlightNotLanded(_flightKey)
    {
        flightInsuredPassengers[_flightKey].push(InsuredData(
            _passenger,
            _amount,
            _multiplier,
            false
        ));
        emit PassengerInsured(_flightKey, _passenger);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees (bytes32 _flightKey)
    internal
    requireIsOperational
    requireIsCallerAuthorized
    {
        for (uint i = 0; i < flightInsuredPassengers[_flightKey].length; i++) {
            if (flightInsuredPassengers[_flightKey][i].credited == false) {
                // credited to true
                flightInsuredPassengers[_flightKey][i].credited = true;
                uint256 amount = calcPremium(flightInsuredPassengers[_flightKey][i].amount,
                    flightInsuredPassengers[_flightKey][i].multiplier);
                pendingWithdrawals[flightInsuredPassengers[_flightKey][i].passenger] += amount;
                emit PassengerCredited(flightInsuredPassengers[_flightKey][i].passenger, amount);
            }
        }
    }

    function calcPremium(uint256 _amount, uint256 _multiplier)
    private
    pure
    returns (uint256)
    {
        return _amount.mul(_multiplier).div(100);
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay (address _address)
    external
    requireIsOperational
    requireIsCallerAuthorized
    {
        require(pendingWithdrawals[_address] > 0, "No fund available for withdrawal");
        uint256 amount = pendingWithdrawals[_address];
        pendingWithdrawals[_address] = 0;
        address(uint160(address(_address))).transfer(amount);
        emit AccountWithdrawal(_address, amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund()
    public
    payable
    {

    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    pure
    internal
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
    external
    payable
    {
        fund();
    }


}

