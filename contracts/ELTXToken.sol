// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ELTXToken
/// @notice Native governance token for ELTX Chain with treasury-controlled minting and pausing.
contract ELTXToken is ERC20, ERC20Burnable, ERC20Permit, Ownable, Pausable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;

    constructor(address treasury) ERC20("ELTX", "ELTX") ERC20Permit("ELTX") Ownable(treasury) {
        require(treasury != address(0), "Treasury cannot be zero");
        _mint(treasury, INITIAL_SUPPLY);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyOwner {
        _burn(account, amount);
    }

    function _update(address from, address to, uint256 amount) internal override(ERC20) whenNotPaused {
        super._update(from, to, amount);
    }
}
