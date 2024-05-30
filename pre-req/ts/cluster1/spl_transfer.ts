import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./wallet/wba-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("241vajFyUX9VNVpuEp8rXiJYFiCjbqmfy7jKYFRvqbXf");

// Random recipient address
const to = Keypair.generate().publicKey;

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to
    );

    // Transfer the new token to the "toTokenAccount" we just created
    const txid = await transfer(
      connection,
      keypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      keypair,
      1000000
    ); // 1,000,000 = 1 token in 6 decimals
    console.log(`Txid: ${txid}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
