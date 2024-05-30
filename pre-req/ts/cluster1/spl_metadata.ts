import wallet from "./wallet/wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { SystemProgram } from "@solana/web3.js";

// Define our Mint address
const mint = publicKey("241vajFyUX9VNVpuEp8rXiJYFiCjbqmfy7jKYFRvqbXf");

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    // const metadataPda = findMetadataPda(umi, {mint: mint})
    // Start here
    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: mint,
      // metadata: metadataPda,
      mintAuthority: signer,
      payer: signer,
      updateAuthority: signer,
    };

    let data: DataV2Args = {
      name: "WOW NFT",
      symbol: "WOW",
      uri: "",
      sellerFeeBasisPoints: 100, //tax
      creators: [
        {
          address: keypair.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    let args: CreateMetadataAccountV3InstructionArgs = {
      data: data,
      isMutable: false,
      collectionDetails: null,
    };

    let tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    let result = await tx.sendAndConfirm(umi).then((r) => {
      console.log(`Signature: ${r.signature.toString()}`);
      // console.log(bs58.encode(result.signature));
      console.log(`Readable signature: ${umi.transactions.deserialize(r.signature)}`)
      console.log(`Result: ${r.result}`)
    });
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
