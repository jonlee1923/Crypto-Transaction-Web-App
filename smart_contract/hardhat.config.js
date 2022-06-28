
require('@nomiclabs/hardhat-waffle');

module.exports={
  solidity: '0.8.0',
  networks:{
    goerli:{
      url: 'https://eth-goerli.alchemyapi.io/v2/4JnNgOBAXyw3qr7gR5bJ_NucSsP7n17V',
      accounts: ['fcde2f83061645a218fc5f883d4df43a7a7e40c1d4bdd22fe366e384797670e9']
    }
  }
}