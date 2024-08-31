import {concat, ethers, keccak256} from "ethers";

let signer = null;

let provider;

let lineaAddress = "0x9ac0cd29b24dfe01eb1bb271bbab36c20d1fc51a";
let croakAddress = "0xcb77fee35f56d7cee520148afb6430aa8d6d0b6e";

const SPIN_FEES = "20.0";
const EFROG_TYPES = ["CF", "SGF","WF","FF","PF","BF"]

const lineaABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "level",
                "type": "uint256"
            }
        ],
        "name": "LevelCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "efrogTYPE",
                "type": "uint256"
            }
        ],
        "name": "RewardedNFT",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "SPIN_FEES",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "hashed",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "data",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "efrogTYPE",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "level",
                "type": "uint256"
            }
        ],
        "name": "distributeRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "faucet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_secret",
                "type": "bytes32"
            }
        ],
        "name": "setSecret",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "spin",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const croakABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]


let lineaContract;
let croakContract;

const hash = (data, secret, efrogTYPE, address, level) => {
    console.log(ethers.encodeBytes32String(secret))
    const encodedData = ethers.solidityPacked(
        ["uint256", "bytes32", "uint256", "address", "uint256"],
        [data, ethers.encodeBytes32String(secret), efrogTYPE, address, level]
    );
    return keccak256(encodedData);
}

const lastLevel = async () => {
    const address = await signer.getAddress()
    const filter = lineaContract.filters.LevelCompleted(address);

    const logs = await lineaContract.queryFilter(filter, "earliest", "latest");
    if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];

        const decodedEvent = lineaContract.interface.parseLog(lastLog);
        window.godotFunctions.levelComplete(parseInt((decodedEvent.args.level).toString()));
    }
}

const getBalance = async () => {
    const address = await signer.getAddress()
    const balance = await lineaContract.balanceOf(address)
    window.godotFunctions.getBalance(parseInt(ethers.formatEther(balance)).toString())

}

const getNFTs = async () => {
    const address = await signer.getAddress()
    const filter = lineaContract.filters.RewardedNFT(address);

    const logs = await lineaContract.queryFilter(filter, "earliest", "latest");
    logs.map(log => {
        const decodedEvent = lineaContract.interface.parseLog(log);
        window.godotFunctions.getNFT(EFROG_TYPES[parseInt((decodedEvent.args.efrogTYPE).toString())])
    })
}

window.onload = async function() {
    if (window.ethereum == null) {

        alert("Please install metamask")
        provider = ethers.getDefaultProvider()

    } else {

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum)

        signer = await provider.getSigner();
        lineaContract = new ethers.Contract(lineaAddress, lineaABI, signer)
        croakContract = new ethers.Contract(croakAddress, croakABI, signer)
    }

}

window.godotFunctions = {};
window.externalator = {
    addGodotFunction: (n,f) => {
        window.godotFunctions[n] = f;
        if (signer) {
            if (n === "getBalance") getBalance()
            if (n === "getNFT") getNFTs()
            if (n === "levelComplete") lastLevel()
        }
    }
}

window.spin = async () => {
    let tx = await croakContract.transfer(lineaAddress, ethers.parseUnits(SPIN_FEES, 18))
    await tx.wait()
}
window.levelComplete = async (level) => {
    const address = await signer.getAddress()
    const calculatedHash = hash(0, process.env.SECRET, 0, address, level)
    let tx = await lineaContract.distributeRewards(calculatedHash, 0, 0, address, level)
    await tx.wait()
    window.godotFunctions.levelComplete(level.toString())
}
window.generateNFT = async (name) => {

    const efrogType = EFROG_TYPES.indexOf(name)
    const address = await signer.getAddress()
    const calculatedHash = hash(3, process.env.SECRET, efrogType, address, 0)

    let tx = await lineaContract.distributeRewards(calculatedHash, 3, efrogType, address, 0)
    await tx.wait()
    window.godotFunctions.getNFT(name)

}
window.croakReward = async (amount) => {
    const address = await signer.getAddress()
    let data;
    if (amount === 10) {
        data = 1
    } else if (amount === 30) {
        data = 2;
    }
    const calculatedHash = hash(data, process.env.SECRET, 0, address, 0)
    let tx = await lineaContract.distributeRewards(calculatedHash, data, 0, address, 0)
    await tx.wait()
    await getBalance()
}

window.faucet = async (amount) => {
    let tx = await lineaContract.faucet()
    await tx.wait()
    await getBalance()
}