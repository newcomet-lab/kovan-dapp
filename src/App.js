import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import { TextField, Grid, Typography, Button } from '@mui/material';

import { formatNumberFromBN, getBNFromNumber } from './utils/helper';
import { BigNumber } from 'ethers';

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [mintAmount, setMintAmount] = useState(0);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    DAI_CONTRACT_ADDRESS: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
  });

  const handleClickConnect = async () => {
    dispatch(connect());
    getData();
  }

  const handleApprove = async () => {
    let gasLimit = CONFIG.GAS_LIMIT;
    setFeedback(`Approving DAI...`);

    setIsPending(true);
    blockchain.daiSmartContract.methods
      .approve(CONFIG.CONTRACT_ADDRESS, BigNumber.from(2).pow(256).sub(1))
      .send({
        gasLimit: String(gasLimit),
        to: CONFIG.DAI_CONTRACT_ADDRESS,
        from: blockchain.account
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setIsPending(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, approved.`
        );
        setIsPending(false);
        dispatch(fetchData(blockchain.account));
      });
  }

  const handleDeposit = async () => {
    let gasLimit = CONFIG.GAS_LIMIT;
    setFeedback(`Depositing DAI...`);

    const amount = getBNFromNumber(mintAmount, parseInt(data.daiTokenDecimals));
    
    if (BigNumber.from(amount).lte(0)) {
      setFeedback("Sorry, the amount is invalid.");
      return;
    }
    if (BigNumber.from(data.daiTokenBalance).sub(amount).lte(0)) {
      setFeedback("Sorry, you cannot deposit DAI greater than the balance.");
      return;
    }

    setIsPending(true);
    blockchain.cdaiSmartContract.methods
      .mint(amount)
      .send({
        gasLimit: String(gasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setIsPending(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, deposited.`
        );
        setIsPending(false);
        dispatch(fetchData(blockchain.account));
      });
  }

  const getData = () => {
    if (blockchain.account !== "" && blockchain.cdaiSmartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <Grid sx={{
      width: 1,
    }}>
      <Grid
        sx={{
          width: '400px',
          marginTop: '30px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingBottom: '20px',
          border: 'solid 1px #aaa'
        }}
      >
        <Typography variant={'h5'}
          sx={{
            margin: '10px',
            padding: '5px',
            border: 'solid 1px #ccc'
          }}
        >cDAI Balance : {data && data.cdaiTokenBalance !== null ? formatNumberFromBN(data.cdaiTokenBalance, parseInt(data.cdaiTokenDecimals)) : ''}</Typography>
        <Typography variant={'h5'}
          sx={{
            margin: '10px',
            padding: '5px',
            border: 'solid 1px #ccc'
          }}
        >DAI Balance : {data && data.daiTokenBalance !== null ? formatNumberFromBN(data.daiTokenBalance, parseInt(data.daiTokenDecimals)) : ''}</Typography>
        <Grid sx={{
          padding: '10px'
        }}>
          <TextField
            fullWidth
            label={''}
            disabled={blockchain.account === "" || blockchain.cdaiSmartContract === null || (data.daiTokenAllowance === 0 || data.daiTokenAllowance === "0") || data.loading || isPending}
            variant="outlined"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
        </Grid>
        <Grid
          sx={{
            marginX: '10px'
          }}
        >
          {blockchain.account === "" || blockchain.cdaiSmartContract === null ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleClickConnect}
            >Connect to the Kovan Testnet</Button>
          ) : (
            <>
              {data.daiTokenAllowance !== 0 && data.daiTokenAllowance !== "0" ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isPending || data.loading || blockchain.account === "" || blockchain.cdaiSmartContract === null}
                  onClick={handleDeposit}
                >Deposit</Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isPending || data.loading || blockchain.account === "" || blockchain.cdaiSmartContract === null}
                  onClick={handleApprove}
                >Approve</Button>
              )}
            </>
          )}
        </Grid>
        {blockchain.errorMsg !== "" ? (
          <div
            sx={{
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                margin: '10px',
                padding: '5px',
                color: '#ff3982'
              }}
            >{blockchain.errorMsg}</Typography>
          </div>
        ) : null}
        {feedback !== '' && (
          <Typography
            sx={{
              margin: '10px',
              padding: '5px',
              color: '#ff3982'
            }}
          >{feedback}</Typography>
        )}
      </Grid>
    </Grid>
  );
}

export default App;
