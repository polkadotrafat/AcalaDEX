pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This ERC-20 contract mints the specified amount of tokens to the contract creator.
contract RTOK is ERC20 {
    constructor(uint256 initialSupply)
        public
        ERC20("RTOKEN", "RTOK")
    {
        _mint(msg.sender, initialSupply);
    }
}
