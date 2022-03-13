import React, { useEffect, useState, Fragment } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { useLottie } from "lottie-react";
import BigNumber from "bignumber.js";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import ClaimingAnimation from "./assets/ClaimingAnimation.json";
import Whitelist from "./assets/whitelist-signed.json";
import { aWSBAirDropABI } from "./ABI/airdrop.json";
import { EIP20 } from "./ABI/eip-20.json";
import { Fairy } from "./ABI/fairy-airdrop.json";
import {
  BSC_MAINNET_ID,
  BSC_TESTNET_ID,
  AWSB_TOKEN_ADDRESS,
  AWSB_TOKEN_ADDRESS_TEST,
  FAIRY_CONTRACT_ADDRESS,
  FAIRY_CONTRACT_ADDRESS_TEST,
  AWSB_AIRDROP_CONTRACT_ADDRESS,
  AWSB_AIRDROP_CONTRACT_ADDRESS_TEST,
  aWSBTokenInfo,
} from "./const";
import airdrop from "./assets/airdrop-mini.png";
import success from "./assets/success-mini.png";
import binanceLogo from "./assets/binance-logo.png";
import metamask from "./assets/metamask.png";
import "./App.less";
import { useWeb3React } from "@web3-react/core";
import { resolve } from "dns";

declare global {
  interface Window {
    ethereum: any;
  }
}

const providerOptions = {
  walletconnect: {
    package: WalletConnect,
    infuraId: "00ca1859789d4b40bce01f4104844224",
    options: {
      rpc: {
        56: "https://bsc-dataseed1.binance.org",
      },
      network: "binance",
      chainId: 56,
    },
  },
};

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions, // required
});

const ethereum = window.ethereum;

let aWSBAirDropContract: ethers.Contract;
let aWSBTokenContract: ethers.Contract;
let FairyAirDropContract: ethers.Contract;

const aWSBTokenAddress = AWSB_TOKEN_ADDRESS;
const aWSBAirDropContractAddress = AWSB_AIRDROP_CONTRACT_ADDRESS;
const FairyAirDropContractAddress = FAIRY_CONTRACT_ADDRESS;

//DEV:
// const aWSBTokenAddress = AWSB_TOKEN_ADDRESS_TEST;
// const aWSBAirDropContractAddress = AWSB_AIRDROP_CONTRACT_ADDRESS_TEST;
// const FairyAirDropContractAddress = FAIRY_CONTRACT_ADDRESS_TEST;

// let ethersProvider: any;
// let signer: any;
// let chainId: any;
// if (ethereum) {
// }

// async function main() {
//   const instance = await web3Modal.connect();
//   ethersProvider = new ethers.providers.Web3Provider(instance);
//   signer = ethersProvider.getSigner();
//   chainId = (await ethersProvider.getNetWork()).chainId;
//   console.log("chainId", chainId);
// }

// main();

// console.log("🚀 ~ file: App.tsx ~ line 33 ~ ethersProvider", ethersProvider);

const formatAddress = (address: string) => {
  return address.substr(0, 8) + "..." + address.substr(address.length - 8, 8);
};

function Loaing() {
  return (
    <div style={{ transform: "scale(0.45)" }}>
      <div className="lds-roller">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

function Claiming() {
  const options = {
    animationData: ClaimingAnimation,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return <div className="claiming-animation">{View}</div>;
}

async function addToMask() {
  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    const wasAdded = await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
        options: {
          address: aWSBTokenInfo.tokenAddress, // The address that the token is at.
          symbol: aWSBTokenInfo.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: aWSBTokenInfo.tokenDecimals, // The number of decimals in the token
          image: aWSBTokenInfo.tokenImage, // A string url of the token logo
        },
      },
    });

    if (wasAdded) {
      console.log("Thanks for your interest!");
    } else {
      console.log("Your loss!");
    }
  } catch (error) {
    console.log(error);
  }
}

function App() {
  const [ethersProvider, setEthersProvider] =
    useState<ethers.providers.Web3Provider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const [address, setAddress] = useState<string>("");
  const [expiredTime, setExpiredTime] = useState<number>(0);
  const [claimBalance, setClaimBalance] = useState<string>("0");
  const [errorNetWork, setErrorNetWork] = useState<boolean>(false);
  const [aWSBTokenBalance, setaWSBTokenBalance] = useState<string>("0");
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState<boolean>();
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [noWallet, setNotWallet] = useState<boolean>(false);
  const [isFairy, setIsFairy] = useState<boolean>(false);
  const [isFairyEvent, setIsFairyEvent] = useState<boolean>(false);
  const [fairyNextReleasedTime, setFairyNextReleasedTime] = useState<number>(0);
  const [fairyClaimBalance, setFairyClaimBalance] = useState<string>("0");

  // useEffect(() => {
  //   if (!ethereum) {
  //     setNotWallet(true);
  //     setConnecting(false);
  //     return;
  //   }
  //   if (ethersProvider !== undefined) {
  //     let chainId: number;
  //     setConnecting(true);
  //     const getNetWork = async () => {
  //       chainId = (await ethersProvider.getNetwork()).chainId;
  //       // dev: BSC_MAINNET_ID
  //       if (chainId !== BSC_MAINNET_ID) {
  //         setErrorNetWork(true);
  //         setAddress("");
  //       }
  //     };
  //     getNetWork();
  //     const getAccount = async () => {
  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //       setIsMetaMaskConnected(Boolean(ethereum.selectedAddress));
  //       setConnecting(false);
  //     };
  //     getAccount();
  //   }
  // }, []);

  const connectToWallet = async () => {
    try {
      setConnecting(true);
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      setEthersProvider(provider);
      const sign = provider.getSigner();
      setSigner(sign);
      const networkId = await provider.getNetwork();
      console.log(networkId);
      const addr = await sign.getAddress();
      console.log("Address", addr);
      setAddress(addr);
      if (networkId.chainId !== BSC_MAINNET_ID) {
        setErrorNetWork(true);
        setAddress("");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsMetaMaskConnected(Boolean(address));
      setConnecting(false);

      // Subscribe to accounts change
      instance.on("accountsChanged", (accounts: string[]) => {
        console.log(accounts);
        setAddress(accounts[0]);
      });

      // Subscribe to chainId change
      instance.on("chainChanged", (chainId: number) => {
        console.log(chainId);
        if (chainId !== BSC_MAINNET_ID) {
          setErrorNetWork(true);
          setAddress("");
        }
      });

      // Subscribe to provider connection
      instance.on("connect", (info: { chainId: number }) => {
        console.log(info);
      });

      // Subscribe to provider disconnection
      instance.on("disconnect", (error: { code: number; message: string }) => {
        setIsMetaMaskConnected(false);
        setAddress("");
        setConnecting(false);
        console.log(error);
      });
    } catch (error) {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (!isMetaMaskConnected) {
      connectToWallet();
    }
  }, []); 

  // const change = (accounts: any[]) => {
  //   setIsMetaMaskConnected(
  //     accounts.length > 0 && Boolean(ethereum.selectedAddress)
  //   );
  //   if (!(accounts.length > 0 && Boolean(ethereum.selectedAddress))) {
  //     setAddress("");
  //   }
  // };
  // if (ethereum) {
  //   ethereum.on("accountsChanged", change);
  // }

  const init = async () => {
    if (signer) {
      aWSBAirDropContract = new ethers.Contract(
        aWSBAirDropContractAddress,
        aWSBAirDropABI,
        ethersProvider
      );
      FairyAirDropContract = new ethers.Contract(
        FairyAirDropContractAddress,
        Fairy,
        ethersProvider
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      aWSBTokenContract = new ethers.Contract(aWSBTokenAddress, EIP20);
      aWSBTokenContract = aWSBTokenContract.connect(signer);
      aWSBAirDropContract = aWSBAirDropContract.connect(signer);
      FairyAirDropContract = FairyAirDropContract.connect(signer);
    }
  };

  const getAirdropInfos = async () => {
    await init();
    if (isMetaMaskConnected && !errorNetWork) {
      let walletAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(walletAccounts[0]);
      let aWSBTokenBalance: ethers.BigNumber =
        await aWSBTokenContract.balanceOf(walletAccounts[0]);

      let expiredTime = ethers.BigNumber.from("1721310400");
      let claimBalance = ethers.BigNumber.from("0");

      let account = walletAccounts[0];
      let claimInfo = Whitelist[account.toLowerCase()];
      //console.log(Whitelist);
      console.log(account.toLowerCase());
      if (claimInfo) {
        let claimed = await aWSBAirDropContract.hashBlacklist(
          claimInfo["hash"]
        );
        expiredTime = ethers.BigNumber.from(claimInfo["expiredAt"]);
        if (claimed === false) {
          claimBalance = ethers.BigNumber.from(claimInfo["amount"]);
        }
      }

      let fairyStatus = false;

      /*
      let expiredTime: ethers.BigNumber = await aWSBAirDropContract.claimExpiredAt();
      let claimBalance: ethers.BigNumber = await aWSBAirDropContract.claimWhitelist(
        walletAccounts[0]
      );
      let fairyStatus: boolean = await FairyAirDropContract.containsFairy(
        walletAccounts[0]
      );*/
      if (fairyStatus) {
        let nextReleasedTime: ethers.BigNumber =
          await FairyAirDropContract.nextReleasedTime();
        console.log(
          "🚀 ~ file: App.tsx ~ line 202 ~ getAirdropInfos ~ nextReleasedTime",
          nextReleasedTime.toNumber()
        );
        let fairyBalance: ethers.BigNumber =
          await FairyAirDropContract.fairyVault(walletAccounts[0]);
        setFairyNextReleasedTime(nextReleasedTime.toNumber());
        setFairyClaimBalance(
          new BigNumber(fairyBalance.toString()).div(1e18).toFixed(4).toString()
        );
      }
      setIsFairy(fairyStatus);
      console.log(
        "🚀 ~ file: App.tsx ~ line 196 ~ getAirdropInfos ~ fairyStatus",
        fairyStatus
      );
      setExpiredTime(expiredTime.toNumber());
      setaWSBTokenBalance(
        new BigNumber(aWSBTokenBalance.toString())
          .div(1e18)
          .toFixed(4)
          .toString()
      );
      setClaimBalance(
        new BigNumber(claimBalance.toString()).div(1e18).toFixed(4).toString()
      );
    }
  };

  useEffect(() => {
    // 获取合约相关信息
    getAirdropInfos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetaMaskConnected]);

  const connectWallet = async () => {
    return await ethereum.request({
      method: "eth_requestAccounts",
    });
  };

  const claimButtonDisabled = isFairyEvent
    ? claiming || claimSuccess || Number(fairyClaimBalance) === 0
    : claiming ||
      claimSuccess ||
      Number(claimBalance) === 0 ||
      dayjs().isAfter(dayjs.unix(expiredTime));

  const claim = async () => {
    setClaiming(true);
    try {
      let process;
      if (isFairyEvent) {
        process = await FairyAirDropContract.claim();
      } else {
        let claimInfo = Whitelist[address.toLowerCase()];
        process = await aWSBAirDropContract.claim(
          claimInfo["amount"],
          claimInfo["expiredAt"],
          claimInfo["v"],
          claimInfo["r"],
          claimInfo["s"]
        );
      }
      try {
        await process.wait();
        setClaimSuccess(true);
        getAirdropInfos();
      } catch (error) {}
      setClaiming(false);
    } catch (error) {
      setClaiming(false);
    }
  };

  return (
    <div className="App">
      <div className="address">
        Token:{AWSB_TOKEN_ADDRESS}
        AirDrop: {AWSB_AIRDROP_CONTRACT_ADDRESS}
      </div>
      <div className="main">
        {claiming ? (
          <Claiming />
        ) : (
          <img
            src={claimSuccess ? success : airdrop}
            className="airdrop-img"
            alt="img"
          />
        )}
        <div className="airdrop">
          <div className="title">
            <span style={{ fontWeight: 900 }}>KIWANO</span>
            <span style={{ fontWeight: 300, marginLeft: "10px" }}>
              AirDrop Event
            </span>
            <div className="version">1.1.0</div>
          </div>
          {isFairy && (
            <div className="fairy">
              {isFairyEvent ? (
                <div style={{ marginRight: "20px" }}>
                  <span style={{ fontSize: 30 }}>🧚‍♀️</span> Welcome Fairy{" "}
                  <span style={{ fontSize: 30 }}>🧚‍♀️</span>
                </div>
              ) : (
                <div
                  className="enter-button"
                  onClick={() => {
                    setIsFairyEvent(true);
                  }}
                >
                  <span style={{ fontSize: 30, marginRight: 5 }}>🧚‍♀️</span>Enter
                  Fairy Airdrop
                </div>
              )}
            </div>
          )}
          <div className="address-info">
            <div className="key address-text">
              <div
                className="connected"
                style={{
                  background: address ? "#52c41a" : "#E1694E",
                }}
              ></div>
              {connecting && "Connecting..."}
              {noWallet && "Wallet not found!"}
              {address
                ? formatAddress(String(address))
                : errorNetWork && !connecting
                ? "BSC Only !   Please Switch NetWork."
                : connecting
                ? ""
                : !noWallet
                ? "Please Unlock Wallet."
                : ""}
            </div>
            {address && (
              <Fragment>
                <div className="key token-balance">
                  Balance:{" "}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {aWSBTokenBalance} KIWANO
                  </span>
                </div>
                <div className="token-info">
                  <div className="bsc-info">
                    <img className="binance-logo" src={binanceLogo} alt="" />
                    <div className="bsc-address">
                      BSC:{" "}
                      <span style={{ fontWeight: 600, marginLeft: 10 }}>
                        {formatAddress(aWSBTokenInfo.tokenAddress)}
                      </span>
                    </div>
                    <img
                      className="metamask-logo"
                      src={metamask}
                      alt=""
                      onClick={addToMask}
                    />
                  </div>
                </div>
                <div className="key claimed-balance">
                  To be claimed:{" "}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {isFairyEvent ? fairyClaimBalance : claimBalance} KIWANO
                  </span>
                </div>
                <div className="key">
                  {isFairyEvent ? "Next Released Time" : "Claims Expired Time:"}
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {dayjs(
                      isFairyEvent
                        ? fairyNextReleasedTime * 1000
                        : expiredTime * 1000
                    ).format("YYYY-MM-DD")}
                  </span>
                </div>
              </Fragment>
            )}
          </div>
          {address ? (
            <button
              className="claim-button"
              onClick={claim}
              disabled={claimButtonDisabled}
              style={{
                background: claimSuccess
                  ? "#52c41a"
                  : claimButtonDisabled
                  ? "#858da1"
                  : "#ec615b",
              }}
            >
              {claiming ? (
                <Loaing />
              ) : claimSuccess ? (
                "Success!"
              ) : isFairyEvent ? (
                "Fairy Claim"
              ) : (
                "Claim"
              )}
            </button>
          ) : errorNetWork || noWallet ? (
            <button
              className="claim-button"
              disabled
              style={{
                background: "#858da1",
              }}
            >
              {noWallet
                ? "Please Install MetaMask."
                : "Please Switch NetWork to BSC."}
            </button>
          ) : (
            <button
              className="claim-button"
              style={{
                background: "#4B2CC8",
              }}
              onClick={connectToWallet}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Unlock Wallet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
