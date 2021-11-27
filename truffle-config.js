const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();
 
module.exports = {
 contracts_build_directory: path.join(__dirname, "client/src/contracts"),
 networks: {

   development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*", 
   },
   ropsten: {
     provider: function() {
       return new HDWalletProvider(`${process.env.MNEMONIC}`, `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`)
     },
     network_id: 3
   },
 },
 
 mocha: {
 },
 compilers: {
   solc: {
     version: "0.8.7",  
     settings: {  
       optimizer: {
       enabled: false,
       runs: 200
       },
     }
   },
 }
};
