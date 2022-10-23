
const blockDelta = 1000000;

const fetchAllEvents = async (contract, event, maxBlock, minBlock = 0) => {
    let fromBlock = minBlock;
    let toBlock = Math.min(maxBlock, fromBlock + blockDelta);

    let promises = [];
    while (fromBlock < maxBlock) {
        promises.push(contract.queryFilter(event, fromBlock, toBlock))
        fromBlock += blockDelta;
        toBlock = Math.min(maxBlock, fromBlock + blockDelta);
    }

    let allEvents = await Promise.all(promises);
    return allEvents.flat();
}

module.exports = {
    fetchAllEvents
}
