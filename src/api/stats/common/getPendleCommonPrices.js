import BigNumber from 'bignumber.js';
import { parseAbi } from 'viem';
import { fetchContract } from '../../rpc/client';
import ERC20Abi from '../../../abis/ERC20Abi';
import { ARBITRUM_CHAIN_ID, ETH_CHAIN_ID } from '../../../constants';

const routerStatic = {
  [ARBITRUM_CHAIN_ID]: '0xAdB09F65bd90d19e3148D9ccb693F3161C6DB3E8',
  [ETH_CHAIN_ID]: '0x263833d47eA3fA4a30f269323aba6a107f9eB14C',
};
const routerAbi = parseAbi([
  'function getLpToAssetRate(address market) external view returns (uint256)',
]);

export const getPendleCommonPrices = async (chainId, pools, tokenPrices, lpPrices) => {
  let prices = {};

  const supplyCalls = pools.map(pool =>
    fetchContract(pool.address, ERC20Abi, chainId).read.totalSupply()
  );
  const lpRatesCalls = pools.map(pool =>
    fetchContract(routerStatic[chainId], routerAbi, chainId).read.getLpToAssetRate([pool.address])
  );
  const [supplyResults, lpRates] = await Promise.all([
    Promise.all(supplyCalls),
    Promise.all(lpRatesCalls),
  ]);

  const poolsData = supplyResults.map((_, i) => {
    return {
      lpRate: new BigNumber(lpRates[i]),
      totalSupply: new BigNumber(supplyResults[i]),
    };
  });
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const lpRate = poolsData[i].lpRate;
    const underlyingPrice = getUnderlyingPrice(pool, tokenPrices, lpPrices);
    const price = lpRate.times(underlyingPrice).div(pool.decimals).toNumber();
    prices[pool.name] = price;

    // console.log(pool.name, 'tvl', poolsData[i].totalSupply.div(pool.decimals).times(price).toNumber());
  }
  return prices;
};

const getUnderlyingPrice = (pool, tokenPrices, lpPrices) => {
  const oracle = pool.oracle;
  const oracleId = pool.oracleId;
  if (!oracle || !oracleId) {
    console.error(`getPendlePrices no oracle or oracleId on ${pool.name}`);
    return 1;
  }
  let tokenPrice = 1;
  if (oracle === 'lps') {
    if (lpPrices.hasOwnProperty(oracleId)) {
      tokenPrice = lpPrices[oracleId];
    } else {
      console.error(`getPendlePrices Unknown lp '${oracleId}'`);
    }
  } else {
    if (tokenPrices.hasOwnProperty(oracleId)) {
      tokenPrice = tokenPrices[oracleId];
    } else {
      console.error(`getPendlePrices Unknown token '${oracleId}'`);
    }
  }
  return tokenPrice;
};
