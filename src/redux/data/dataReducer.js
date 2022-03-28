const initialState = {
  loading: false,
  cdaiTokenBalance: 0,
  cdaiTokenDecimals: 0,
  daiTokenBalance: 0,
  daiTokenDecimals: 0,
  daiTokenAllowance: 0,
  cost: 0,
  error: false,
  errorMsg: "",
};

const dataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_DATA_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_SUCCESS":
      return {
        ...state,
        loading: false,
        cdaiTokenBalance: action.payload.cdaiTokenBalance,
        cdaiTokenDecimals: action.payload.cdaiTokenDecimals,
        daiTokenBalance: action.payload.daiTokenBalance,
        daiTokenDecimals: action.payload.daiTokenDecimals,
        daiTokenAllowance: action.payload.daiTokenAllowance,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_FAILED":
      return {
        ...initialState,
        loading: false,
        error: true,
        errorMsg: action.payload,
      };
    default:
      return state;
  }
};

export default dataReducer;
