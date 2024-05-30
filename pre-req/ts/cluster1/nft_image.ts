import wallet from "./wallet/wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
// import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        const image = await readFile("");
        //2. Convert image to generic file.
        const img_gen = createGenericFile(image, "generug-gen", {contentType: "image/png"} );

        //3. Upload image
        // const irys = new Irys({ network, token, key });
        // const fundTx = await irys.fund(irys.utils.toAtomic(0.05));
        // // Add a custom tag that tells the gateway how to serve this file to a browser
        // const tags = [{ name: "Content-Type", value: "image/png" }];
        // const receipt = await irys.uploadFile("./myImage.png", tags);
        // console.log(`File uploaded ==> https://gateway.irys.xyz/${response.id}`);
 
        // const image = 

        // You can use this or use createBundlrUploader(umi).upload([img_gen])
        const [myUri] = await umi.uploader.upload([img_gen]);
        console.log("Your image URI: ", myUri);
        //https://arweave.net/sg7wIuv9U2Ifml2h58u-PyHxDDKUgfA8fFCtizczz_A
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
