import { getRewardPoolApys } from '../common/getRewardPoolApys';
const { polygonWeb3 } = require('../../../utils/web3');

export const getQuickSingleApys = async () => {
  const newQuickApy = getRewardPoolApys({
    pools: [
      {
        name: 'quick-newquick',
        address: '0xB5C064F955D8e7F38fE0460C556a72987494eE17',
        rewardPool: '0x665c09FC6526bd0d73A72235A1736cd63FBc4357',
        oracle: 'tokens',
        oracleId: 'newQUICK',
        decimals: '1e18',
      },
    ],
    oracleId: 'CP',
    oracle: 'tokens',
    decimals: '1e18',
    web3: polygonWeb3,
    chainId: 137,
    // log: true,
  });

  let apys = {};
  let apyBreakdowns = {};

  const results = await Promise.allSettled([newQuickApy]);
  for (const result of results) {
    if (result.status !== 'fulfilled') {
      console.warn('getQuickApys error', result.reason);
    } else {
      apys = { ...apys, ...result.value.apys };
      apyBreakdowns = { ...apyBreakdowns, ...result.value.apyBreakdowns };
    }
  }

  return {
    apys,
    apyBreakdowns,
  };
};
