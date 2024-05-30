import wallet from "./wallet/wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://arweave.net/sg7wIuv9U2Ifml2h58u-PyHxDDKUgfA8fFCtizczz_A"
        const metadata = {
            name: "Crazy Ass Rug",
            symbol: "CAR",
            description: "Splendid Rug",
            image: "image",
            attributes: [
                {trait_type: 'Shape', value: 'Rectangle'}
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: image
                    },
                ]
            },
            creators: []
        };
        const myUri = await createBundlrUploader(umi).uploadJson(metadata)
        // https://arweave.net/QYoS3ipWtdyLSSeM4zpTqUSo5X69uK6OY9RFWd1VIOY
        console.log("Your image URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
