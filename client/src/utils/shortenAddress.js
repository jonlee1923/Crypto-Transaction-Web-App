// first 5 and last 4
export const shortenAddress = (address) => `${address.slice(0,5)}...${address.slice(address.length - 4)}`;