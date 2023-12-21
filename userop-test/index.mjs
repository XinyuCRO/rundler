import { ethers,Wallet,Contract } from "ethers";
import { Presets,Client } from "userop";

import { config } from "dotenv";
config();

const NODE_RPC_URL = process.env.NODE_RPC_URL;
const BUNDLER_RPC_URL = process.env.BUNDLER_RPC_URL;
const SIGNER_PKEY = process.env.SIGNER_PKEY;
const ENTRY_POINTS = process.env.ENTRY_POINTS;
const ACCOUNT_FACTORY = process.env.ACCOUNT_FACTORY;

async function main() {

  const provider = new ethers.providers.JsonRpcProvider(NODE_RPC_URL);

  // signer is the owner of the smart account
  const signer = new ethers.Wallet(SIGNER_PKEY)

  // these two address are different
  // need to fund the smart account before running this script
  console.log(`Signer  address: ${signer.address}`);
  console.log(`Signer Balance: ${await provider.getBalance(signer.address)}`)


  // Initialize userop builder
  var builder = await Presets.Builder.SimpleAccount.init(
    signer,
    NODE_RPC_URL,
    {
      overrideBundlerRpc: BUNDLER_RPC_URL,
      entryPoint: ENTRY_POINTS,
      factory: ACCOUNT_FACTORY,
    }
  );
  
  console.log(`Account address: ${builder.getSender()}`);
  console.log(`Account balance: ${await provider.getBalance(builder.getSender()) }`)

  // build a tranfer transaction
  builder = builder
    .execute(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "100",
      ethers.utils.hexlify("0x")
    )

  // create the client
  const client = await Client.init(
    NODE_RPC_URL,
    {
      overrideBundlerRpc: BUNDLER_RPC_URL,
      entryPoint: ENTRY_POINTS,
      factory: ACCOUNT_FACTORY,
    }
  );

  // send the useroperation to the bundler node
  const res = await client.sendUserOperation(builder, {
    onBuild: (op) => {
      console.log("Signed UserOperation:",op);
    },
  });


  console.log(`UserOpHash: ${res.userOpHash}`);

  // !!! this step with stuck in the local geth dev setup
  // because the bundler node is waiting for new block event to bundle the userops
  // try to send a new tx in the local geth dev setup to trigger bundle
  console.log("Waiting for transaction...");
  const ev = await res.wait();


  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}

main().then();