// SPDX-License-Identifier: GPL-3

pragma solidity ^0.8.4;


contract SimpleBank {
    
    struct structUser {
        uint balance;
        bool enrolled;
        bool locked;
    }
    
    //
    // State variables
    //

    mapping(address => structUser) private users;

    /* Let's make sure everyone knows who owns the bank. */
    address public owner;


    //
    // Events 
    //

    /* Add an argument for this event, an accountAddress */
    event LogEnrolled(address indexed enrolled);

    /* Add 2 arguments for this event, an accountAddress and an amount */
    event LogDepositMade(address indexed user, uint256 amount);

    /* Create an event that logs Withdrawals 
    It should log 3 arguments: 
    the account address, the amount withdrawn, and the new balance. */
    event Withdrawal(address indexed user, uint256 amount, uint256 new_balance);


    //
    // Functions
    //

    constructor() {
        /* Set the owner to the creator of this contract */
        owner = msg.sender;
    }

    
    // Function to receive Ether
    receive() external payable {
        deposit();
    }

    
    modifier lock() {
        require(!users[msg.sender].locked, "User is locked in another transaction");
        users[msg.sender].locked = true;
        _;
        users[msg.sender].locked = false;
    }

    modifier isEnrolled() {
        require(users[msg.sender].enrolled, "You are not enrolled in SimpleBank. Please enroll before other interactions");
        _;
    }

    modifier greaterThanZero(uint amount) {
        require(amount > 0, "Value has to be greater than zero!");
        _;
    }

    /// @notice Get balance
    /// @return The balance of the user
    function getBalance() public view returns (uint) {
        /* Get the balance of the sender of this transaction */
        return users[msg.sender].balance;
    }

    /// @notice Enroll a customer with the bank
    /// @return The users enrolled status
    // Emit the appropriate event
    function enroll() public returns (bool) {
        require(!users[msg.sender].enrolled, "User already enrolled");
        users[msg.sender].enrolled = true;
        emit LogEnrolled(msg.sender);
        return users[msg.sender].enrolled;
    }

    /// @notice Deposit ether into bank
    /// @return The balance of the user after the deposit is made
    // This function can receive ether
    // Users should be enrolled before they can make deposits
    function deposit() public payable isEnrolled greaterThanZero(msg.value) returns (uint) {
        users[msg.sender].balance += msg.value;
        emit LogDepositMade(msg.sender, msg.value);
        return users[msg.sender].balance;
    }

    /// @notice Withdraw ether from bank
    /// @param withdrawAmount amount you want to withdraw
    /// @return The balance remaining for the user
    // Emit the appropriate event
    function withdraw(uint withdrawAmount) public isEnrolled greaterThanZero(withdrawAmount) lock returns (uint) {
        require(users[msg.sender].balance >= withdrawAmount, "You have not the required money to withdraw.");
        users[msg.sender].balance -= withdrawAmount;
        uint new_balance = users[msg.sender].balance;
        (bool sent, ) = msg.sender.call{value: withdrawAmount}("");
        require(sent, "Could not withdraw!");
        emit Withdrawal(msg.sender, withdrawAmount, new_balance);
        return new_balance;
    }

    /// @notice Withdraw remaining ether from bank
    /// @return bool transaction success
    // Emit the appropriate event
    function withdrawAll() public returns (bool) {
        withdraw(users[msg.sender].balance);
        return true;
    }



}