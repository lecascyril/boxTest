// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract SimpleStorage {
  uint storedData;

  event isSet (uint value);

  function set(uint x) public {
    storedData = x;
    emit isSet(x);
  }

  function get() public view returns (uint) {
    return storedData;
  }
}
