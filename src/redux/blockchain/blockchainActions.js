// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
// log
import { fetchData } from "../data/dataActions";

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

class TransactionChecker {
  constructor(address) {
      this.address = address.toLowerCase();
      this.web3 = new Web3("https://kovan.infura.io/v3/f5ea2d9cf9194e99b8ad6ed75969b366");
}

async checkBlock() {
  let block = await this.web3.eth.getBlock('latest');
  let number = block.number;
  let transactions = block.transactions;
  //console.log('Search Block: ' + transactions);

  if (block != null && block.transactions != null) {
      for (let txHash of block.transactions) {
          let tx = await this.web3.eth.getTransaction(txHash);
          if (this.address == tx.to.toLowerCase()) {
              console.log("from: " + tx.from.toLowerCase() + " to: " + tx.to.toLowerCase() + " value: " + tx.value);
          }
      }
  }
}
}


export const getTransactions = async (web3, account) => {
  const eth = web3.eth;
  var myAddr = account;
  var currentBlock = await eth.getBlockNumber();
  console.log(currentBlock)
  var n = await eth.getTransactionCount(myAddr, currentBlock);
  console.log(n)
  var bal = await eth.getBalance(myAddr, currentBlock);
  console.log(bal)
  const counter = 0;
  for (var i=currentBlock; i >= 0 && (n > 0 || bal > 0); --i) {
    if (counter === 1) break;

    try {
        var block = await eth.getBlock(i, true);
        if (block && block.transactions) {
            block.transactions.forEach(function(e) {
                if (myAddr == e.from) {
                    if (e.from != e.to)
                        bal = bal.plus(e.value);
                    console.log(i, e.from, e.to, e.value.toString(10));
                    --n;
                    counter++;
                }
                if (myAddr == e.to) {
                    if (e.from != e.to)
                        bal = bal.minus(e.value);
                    console.log(i, e.from, e.to, e.value.toString(10));
                    counter++;
                }
            });
        }
    } catch (e) { console.error("Error in block " + i, e); }
  }

}

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    const daiAbiResponse = await fetch("/config/dai-abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const daiAbi = await daiAbiResponse.json();
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == CONFIG.NETWORK.ID) {
          const SmartContractObj = new Web3EthContract(
            abi,
            CONFIG.CONTRACT_ADDRESS
          );
          const DaiSmartContractObj = new Web3EthContract(
            daiAbi,
            CONFIG.DAI_CONTRACT_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              cdaiSmartContract: SmartContractObj,
              daiSmartContract: DaiSmartContractObj,
              cdaiContractAddress: CONFIG.CONTRACT_ADDRESS,
              daiContractAddress: CONFIG.DAI_CONTRACT_ADDRESS,
              web3: web3,
            })
          );
          var transactionChecker = new TransactionChecker(accounts[0]);
          await transactionChecker.checkBlock();
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
        }
      } catch (err) {
        dispatch(connectFailed("Something went wrong."));
      }
    } else {
      dispatch(connectFailed("Install Metamask."));
    }
  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
