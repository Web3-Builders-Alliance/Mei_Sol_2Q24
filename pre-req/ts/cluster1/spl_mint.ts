import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "./wallet/wba-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("241vajFyUX9VNVpuEp8rXiJYFiCjbqmfy7jKYFRvqbXf");

// Your ata is: BzmfR3gkh5iNjAgomNaLXwG5aA5zfR6nKkVEVAZdd5Ne
// Your mint txid: 51Jihsidpk1iaeYXCz81bJCzRnDmqXkKmAkzPtsquh5QJLnQuHEXKUxSufk8NMoizwM934qZuoMLkevCQEfVFazG

(async () => {
  try {
    // Create an ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(`Your ata is: ${ata.address.toBase58()}`);

    // Mint to ATA
    const mintTx = await mintTo(connection, keypair, mint, ata.address, keypair, 8888n * token_decimals)
    console.log(`Your mint txid: ${mintTx}`);
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
