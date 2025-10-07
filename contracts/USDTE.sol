// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title USDTE
/// @notice Temporary USD-pegged utility token for bootstrap liquidity on ELTX Chain.
contract USDTE is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor(address treasury) ERC20("ELTX USD", "USDTE") Ownable(treasury) {
        require(treasury != address(0), "Treasury cannot be zero");
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
