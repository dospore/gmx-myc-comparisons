const { PositionRouter__factory } = require("@mycelium-ethereum/perpetual-swaps-contracts");
const { ethers } = require("ethers");
const { plot } = require('nodeplotlib');
const { fetchAllEvents } = require('./helpers');

// ARBITRUM CONFIG
const mycPositionRouter = "0xE510571cAc76279DADf6c4b6eAcE5370F86e3dC2"; // MYC
const gmxPositionRouter = "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868"; // GMX
const rpcUrl = 'https://arb1.arbitrum.io/rpc'

// ARBITRUM RINKEBY
// const positionRouterAddress = "0xD4aF631cEBA8C4c10a85015923F820A2ee98b119";
// const rpcUrl = 'https://rinkeby.arbitrum.io/rpc'

// ARBITRUM GOERLI CONFIG
// const positionRouterAddress = "0x2d78AE5147D358d803e6306D96db1AB995a4AAF1";
// const rpcUrl = 'https://goerli-rollup.arbitrum.io/rpc';

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const getMedian = (arr, k) => {
    const mid = Math.floor(arr.length / 2), nums = arr.map((a) => a.args[k]).sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

const getInfo = (positions) => {
    let info = {
        blockGap: ethers.BigNumber.from(0),
        timeGap: ethers.BigNumber.from(0),
        minBlockGap: ethers.BigNumber.from(0),
        maxBlockGap: ethers.BigNumber.from(0),
        medianBlockGap: ethers.BigNumber.from(0),
        averageBlockGap: ethers.BigNumber.from(0),
        minTimeGap: ethers.BigNumber.from(0),
        maxTimeGap: ethers.BigNumber.from(0),
        medianTimeGap: ethers.BigNumber.from(0),
        averageTimeGap: ethers.BigNumber.from(0),
        totalResults: positions.length,
        blockGaps: [],
        timeGaps: [],
        blockNumbers: []
    };
    if (positions.length === 0) {
        console.log('No position data')
        return info;
    }
    info.minBlockGap = positions[0].args.blockGap;
    info.minTimeGap = positions[0].args.timeGap;
    info.medianTimeGap = getMedian(positions, 'timeGap')
    info.medianBlockGap = getMedian(positions, 'blockGap')

    positions.forEach((order) => {
        const timeGap = order.args.timeGap;
        const blockGap = order.args.blockGap;
        info.blockGaps.push(blockGap.toNumber());
        info.timeGaps.push(timeGap.toNumber());
        info.blockGap = info.blockGap.add(blockGap);
        info.timeGap = info.timeGap.add(timeGap);
        info.blockNumbers.push(order.blockNumber)
        if (timeGap.lt(info.minTimeGap)) {
            info.minTimeGap = timeGap;
        }
        if (timeGap.gt(info.maxTimeGap)) {
            info.maxTimeGap = timeGap;
        }
        if (blockGap.lt(info.minBlockGap)) {
            info.minBlockGap = blockGap;
        }
        if (blockGap.gt(info.maxBlockGap)) {
            info.maxBlockGap = blockGap;
        }
    })
    info.averageBlockGap = info.blockGap / info.totalResults
    info.averageTimeGap = info.timeGap / info.totalResults
    return info;
}

const plotLineData = (info, title) => {
    const blockGaps = [
      {
        x: info.blockNumbers,
        y: info.blockGaps,
        name: 'Block gaps',
        type: 'scatter',
      },
    ];
    const timeGaps = [
      {
        x: info.blockNumbers,
        y: info.timeGaps,
        name: 'Time gaps',
        type: 'scatter',
      },
    ];
    plot(timeGaps, { title: `${title} Time Gaps` })
    plot(blockGaps, { title: `${title} Block Gaps` })
}

const plotScatter = (increaseInfo, decreaseInfo) => {
    const allScatterData = [
      {
        x: increaseInfo.timeGaps.concat(decreaseInfo.timeGaps),
        y: increaseInfo.blockGaps.concat(decreaseInfo.blockGaps),
        mode: 'markers',
        type: 'scatter',
      },
    ];
    const layout = {
        title: "All Time Gaps vs Block Gaps",
        xaxis: { 
            title: "Time Gaps"
        },
        yaxis: {
            title: "Block Gaps"
        }
    }
    plot(allScatterData, layout);
}

const fetchExecutionTimes = async (positionRouterAddress, fromBlock, toBlock, project) => {
    const positionRouter = PositionRouter__factory.connect(positionRouterAddress, provider);

    const [increasePositions, decreasePositions] = await Promise.all([
        fetchAllEvents(positionRouter, 'ExecuteIncreasePosition', toBlock, fromBlock),
        fetchAllEvents(positionRouter, 'ExecuteDecreasePosition', toBlock, fromBlock),
    ])

    const increasePositionInfo = getInfo(increasePositions);
    const decreasePositionInfo = getInfo(decreasePositions);

    plotScatter(increasePositionInfo, decreasePositionInfo);

    plotLineData(increasePositionInfo, "Increase Positions");
    plotLineData(decreasePositionInfo, "Decrease Positions");

    console.log(`** ${project} INCREASE POSITIONS **`)
    console.log(`Average block difference: ${increasePositionInfo.averageBlockGap} blocks`)
    console.log(`Max block difference: ${increasePositionInfo.maxBlockGap} blocks`)
    console.log(`Min block difference: ${increasePositionInfo.minBlockGap} blocks`)
    console.log(`Median block difference: ${increasePositionInfo.medianBlockGap} blocks`)
    console.log(`Average time difference: ${increasePositionInfo.averageTimeGap} seconds`)
    console.log(`Max time difference: ${increasePositionInfo.maxTimeGap} seconds`)
    console.log(`Min time difference: ${increasePositionInfo.minTimeGap} seconds`)
    console.log(`Median time difference: ${increasePositionInfo.medianTimeGap} seconds`)

    console.log();

    console.log(`** ${project} DECREASE POSITIONS **`)
    console.log(`Average block difference: ${decreasePositionInfo.averageBlockGap} blocks`)
    console.log(`Max block difference: ${decreasePositionInfo.maxBlockGap} blocks`)
    console.log(`Min block difference: ${decreasePositionInfo.minBlockGap} blocks`)
    console.log(`Median block difference: ${decreasePositionInfo.medianBlockGap} blocks`)
    console.log(`Average time difference: ${decreasePositionInfo.averageTimeGap} seconds`)
    console.log(`Max time difference: ${decreasePositionInfo.maxTimeGap} seconds`)
    console.log(`Min time difference: ${decreasePositionInfo.minTimeGap.toString()} seconds`)
    console.log(`Median time difference: ${decreasePositionInfo.medianTimeGap.toString()} seconds`)
}

const main = async () => {
    const currentBlock = await provider.getBlock();
    const currentBlockNumber = currentBlock.number;
    const fromBlock = currentBlockNumber - 1000000;
    const toBlock = currentBlockNumber;

    await fetchExecutionTimes(mycPositionRouter, fromBlock, toBlock, 'MYC');
    await fetchExecutionTimes(gmxPositionRouter, fromBlock, toBlock, 'GMX');
}


main();
