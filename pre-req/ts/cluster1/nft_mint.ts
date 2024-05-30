import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "./wallet/wba-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "Best Rug",
    symbol: "BRUG",
    uri: "https://arweave.net/QYoS3ipWtdyLSSeM4zpTqUSo5X69uK6OY9RFWd1VIOY",
    sellerFeeBasisPoints: percentAmount(10),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

    // https://explorer.solana.com/tx/baDNeNc7G2v5fZ4wQWLF1uB17JBLp9W3DJH4Lk9LVsHeEfe98ewtxbCAjp8Sy5912TFGcemJPTYWbLTMWe3Y1jo?cluster=devnet
    // Mint Address:  9A7vKgdM5rMmfEnCxTpWfwGqEqJhinK7jmFgaEMvyQBN

  console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)

  console.log("Mint Address: ", mint.publicKey);
})();
