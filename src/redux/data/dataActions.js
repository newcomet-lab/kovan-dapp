// log
import store from "../store";

const fetchDataRequest = () => {
  return {
    type: "CHECK_DATA_REQUEST",
  };
};

const fetchDataSuccess = (payload) => {
  return {
    type: "CHECK_DATA_SUCCESS",
    payload: payload,
  };
};

const fetchDataFailed = (payload) => {
  return {
    type: "CHECK_DATA_FAILED",
    payload: payload,
  };
};

export const fetchData = (account) => {
  return async (dispatch) => {
    dispatch(fetchDataRequest());
    try {
      const state = store.getState();

      const cdaiTokenBalance = await state.blockchain.cdaiSmartContract.methods
        .balanceOf(account).call();

      const cdaiTokenDecimals = await state.blockchain.cdaiSmartContract.methods
        .decimals().call();

      const daiTokenBalance = await state.blockchain.daiSmartContract.methods
        .balanceOf(account).call();

      const daiTokenDecimals = await state.blockchain.daiSmartContract.methods
        .decimals().call();

      const daiTokenAllowance = await state.blockchain.daiSmartContract.methods
        .allowance(account, state.blockchain.cdaiContractAddress).call();

      dispatch(
        fetchDataSuccess({
          cdaiTokenBalance,
          cdaiTokenDecimals,
          daiTokenBalance,
          daiTokenDecimals,
          daiTokenAllowance
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDataFailed("Could not load data from contract."));
    }
  };
};
