import { Network, Alchemy } from "alchemy-sdk";
import axios from 'axios';
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-sepolia.g.alchemy.com/v2/NOJq8pxdrCeoKdvyJu4CdnO-d6H6L8C5");

const alchemy = new Alchemy({
    apiKey: "NOJq8pxdrCeoKdvyJu4CdnO-d6H6L8C5",
    network: Network.ETH_SEPOLIA
});

const contractAbi = require('./abi.json');
const contractAddress = "0x70f2D1bbBFc5B5853Bbc96380e185988DeAd4dC8";

const nftContract = new web3.eth.Contract(contractAbi, contractAddress);


export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            if(chainId != "0xaa36a7"){
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }],
                });
            }
            
            return {
                success: true,
                status: "Connected",
                address: addressArray[0],
            };
        } catch (err) {
            return {
                success: false,
                address: "",
                status: err.message,
            };
        }
    } else {
        return {
            success: false,
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
        };
    }
};
  
export const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            });

            if (addressArray.length > 0) {

                return {
                    address: addressArray[0],
                    status: "connected",
                    success: true,
                };
            } else {
                return {
                    address: "",
                    status: "Connect your wallet",
                    success: false,
                };
            }
        } catch (err) {
            return {
                address: "",
                status: err.message,
                success: false,
            };
        }
    } else {
        return {
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
            success: false
        };
    }
};


let response = {
    success: false,
    status: ""
};


export const getUserTokens = async (wallectAddress) => {
    let itemArray = [];

    const result = await alchemy.nft.getNftsForOwner(wallectAddress, {
        contractAddresses : [contractAddress]
    });

    console.log(result);

    for (let index = 0; index < result.totalCount; index++) {
        // let justRefresh = await axios.get(`https://eth-goerli.g.alchemy.com/nft/v2/CH1V81ZMzVXNjIFWnRNNTTgY0nD_Twh6/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${result.ownedNfts[index]?.tokenId}&tokenType=ERC721&refreshCache=true`).catch(function (error) {
        //     console.log(error.toJSON());
        // });
        let tokenId = result.ownedNfts[index]?.tokenId;
        let rawImg = result.ownedNfts[index]?.rawMetadata.image;
        var name = result.ownedNfts[index]?.rawMetadata.name;
        let image = rawImg?.replace('ipfs://', 'https://ipfs.io/ipfs/');
        itemArray.push({
            name: name,
            img: image,
            tokenId: tokenId
        });
    }
    return itemArray;
};

const getPublicCost = async () => {
    const result = await nftContract.methods.mintPrice().call();
    const resultEther = web3.utils.fromWei(result, "ether");
    return resultEther;
};

export const getBalanceToken = async (wallectAddress) => {
    const result = await nftContract.methods.balanceOf(wallectAddress).call();
    return result;
};


export const confirmReveal = async (wallectAddress) => {
    var message = "Confrim reveal of nft";
    var hash = await web3.utils.sha3(message);
    await web3.eth.personal.sign(message, wallectAddress, function(error, signature) {
        // console.log(signature, error);
        if(signature) response.success = true;
    });

    return response;
}


export const mintPublic = async (mintAmount, wallectAddress) => {
    const costEther = await getPublicCost();
    const costWEI = web3.utils.toWei(costEther, "ether");
    await nftContract.methods.publicMint(mintAmount)
    .send({
      value: (costWEI * mintAmount).toString(),
      from: wallectAddress,
      to: contractAddress
    })
    .then(function(receipt){
      console.log("receipt: ", receipt);
      response.success = true;
      response.status = "Mint successfully"
    }).catch(function(error){
      console.log("error: ", error);
      response.success = false;
      response.status = "Something went wrong";
    });
  
    return response;
};

export {
    getPublicCost
}