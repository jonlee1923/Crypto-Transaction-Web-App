import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';

import {contractABI, contractAddress} from '../utils/constants';

export const TransactionContext = React.createContext(); //creating react context

const {ethereum} = window; //access ethereum object

//fetch ethereum contract

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer); //used to fetch contract

    // console.log({   
    //     provider,
    //     signer, 
    //     transactionContract
    // });
    return transactionContract;
}

//create a context to call the getEthereumContract function
export const TransactionProvider = ({children}) => {
    
    const[currentAccount, setCurrentAccount] = useState("")

    //stores the form data with err seems like a dict?
    const [formData, setFormData] = useState({addressTo: '', amount: '', keyword: '', message: ''});
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount')); //stored in the localstorage so that we can alwways keep track of the transaction count
    const [transactions, setTransactions] = useState([]);
    //this handle change dynamically updates form data 
    //e is the keypress
    //I think this returns prevstate combined with the new state in [name]
    const handleChange = (e, name) =>{
        setFormData((prevState) => ({...prevState, [name]: e.target.value}));
    };

    const getAllTransactions = async () =>{
        try {
            if(!ethereum) return alert("Please install metamask");

            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();

            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber()* 1000).toLocaleString(), //get the proper timestamp format
                message:transaction.message,
                keyword:transaction.keyword,
                amount:parseInt(transaction.amount._hex) / (10 ** 18) //convert to ether as all values are written in hex wei so need to multiply
            }))

            console.log(structuredTransactions);

            setTransactions(structuredTransactions);
        } catch (error) {
            console.log(error);
        }
    }

    const checkIfWalletIsConnected = async () => {
        try{
            if(!ethereum) return alert("Please install metamask");
        
            const accounts = await ethereum.request({method: 'eth_accounts'});

            if(accounts.length){
                setCurrentAccount(accounts[0]);

                //calling the get transactions function here
                getAllTransactions();
            }else{
                console.log('No accounts found');
            }

        }catch(error){
            console.log(error);
            throw new Error("No ethereum object.");
        }
    }

    const checkIfTransactionsExist = async () => {
        try {
            const transactionContract = getEthereumContract();
            transactionCount = await transactionContract.getTransactioncount();

            windows.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {

            throw new Error("No ethereum object.");
            
        }
    }

    const connectWallet = async () => {
        try {
          if (!ethereum) return alert("Please install MetaMask.");
    
          const accounts = await ethereum.request({ method: "eth_requestAccounts", });
    
          setCurrentAccount(accounts[0]);
          window.location.reload();
        } catch (error) {
          console.log(error);
    
          throw new Error("No ethereum object");
        }
      };
    
    const sendTransaction = async () => {
        try {
            if(!ethereum) return alert("Please install MetaMask.");
            console.log("in sendTransaction");
            const {addressTo, amount, keyword, message} = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount); //parses wei amount into hexadecimal amt

            await ethereum.request({
                method: 'eth_sendTransaction',
                params:[{
                    from:currentAccount,
                    to: addressTo,
                    gas: '0x5208', //21000 GWEI
                    value: parsedAmount._hex, //convert to gwei or hex
                }]
            });
            console.log("before");

            //to store the transaction in our smart contract
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            console.log("after");
            setIsLoading(true);
            console.log('Loading - ${transactionHash}.hash');
            await transactionHash.wait();
            setIsLoading(false);
            console.log('Success - ${transactionHash.hash');

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber()); //sets the count in the local storage

        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, []);

    return(
        <TransactionContext.Provider value={{connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading}}>
            {/* the children that are wrapped within these will then have access to the value inside this object */}
            {children}
        </TransactionContext.Provider>
    )
}