import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import { TextField, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link } from '@mui/material';

import { formatNumberFromBN, getBNFromNumber, formatUTC } from './utils/helper';
import { BigNumber } from 'ethers';

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [mintAmount, setMintAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
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
        getTransactions(blockchain.account);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, approved.`
        );
        setIsPending(false);
        dispatch(fetchData(blockchain.account));
        getTransactions(blockchain.account);
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
        getTransactions(blockchain.account);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, deposited.`
        );
        setIsPending(false);
        dispatch(fetchData(blockchain.account));
        getTransactions(blockchain.account);
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

  const getTransactions = async (account) => {
    const resp = await fetch(`https://api-kovan.etherscan.io/api?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=XF74TBYV4CQS3XKFAK94JSQJ8H1B6SVCR8`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const respData = await resp.json();
    console.log(respData);
    setTransactions(respData.result);
    return respData.result;
  }
  
  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
    if (blockchain.account !== null && blockchain.account !== "")
      getTransactions(blockchain.account);
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
      <TableContainer component={Paper} sx={{marginTop: '30px'}}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Txn Hash</TableCell>
              <TableCell>Block</TableCell>
              <TableCell>DateTime</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Txn Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow
                key={tx.hash}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Link href={`https://kovan.etherscan.io/tx/${tx.hash}`}>{tx.hash.substr(0, 20)}...</Link>
                </TableCell>
                <TableCell>{tx.blockNumber}</TableCell>
                <TableCell>{formatUTC(parseInt(tx.timeStamp))}</TableCell>
                <TableCell>
                  {blockchain.account !== tx.from ? (
                    <Link href={`https://kovan.etherscan.io/address/${tx.from}`}>{tx.from}</Link>
                  ) : tx.from}
                </TableCell>
                <TableCell>
                  {blockchain.account !== tx.to ? (
                    <Link href={`https://kovan.etherscan.io/address/${tx.to}`}>{tx.to}</Link>
                  ) : tx.to}
                </TableCell>
                <TableCell>{formatNumberFromBN(tx.value, 18)}</TableCell>
                <TableCell>{formatNumberFromBN(BigNumber.from(tx.gasPrice).mul(BigNumber.from(tx.gasUsed)), 18)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Grid>
  );
}

export default App;
