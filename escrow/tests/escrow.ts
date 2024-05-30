import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Escrow } from "../target/types/escrow";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { randomBytes } from "crypto";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const wallet = provider.wallet as NodeWallet;

  const maker = anchor.web3.Keypair.generate();
  const taker = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;

  let makerAtaA: anchor.web3.PublicKey;
  let makerAtaB: anchor.web3.PublicKey;

  let takerAtaA: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;

  // Same seed for both maker and taker for the escrow
  const seed = new anchor.BN(randomBytes(8));

  const escrow = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  )[0];

     

  it("Airdrop Sol to maker and taker", async () => {
    const tx = await provider.connection.requestAirdrop(maker.publicKey, 1000000000);
    await provider.connection.confirmTransaction(tx);
    console.log("Maker balance: ", await provider.connection.getBalance(maker.publicKey));

    const tx2 = await provider.connection.requestAirdrop(taker.publicKey, 1000000000);
    await provider.connection.confirmTransaction(tx2);
    console.log("Taker balance: ", await provider.connection.getBalance(taker.publicKey));
  });

  it("Create Tokens and Mint Tokens", async () => {
    mintA  = await createMint(provider.connection, wallet.payer, provider.publicKey, provider.publicKey, 6);
    console.log("Mint A: ", mintA.toBase58());
    mintB  = await createMint(provider.connection, wallet.payer, provider.publicKey, provider.publicKey, 6);
    console.log("Mint B: ", mintB.toBase58());

    makerAtaA = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintA, maker.publicKey)).address;
    makerAtaB = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintB, maker.publicKey)).address;

    takerAtaA = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintA, taker.publicKey)).address;
    takerAtaB = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintB, taker.publicKey)).address;

    await mintTo(provider.connection, wallet.payer, mintA, makerAtaA, provider.publicKey, 1_000_000_0);
    await mintTo(provider.connection, wallet.payer, mintB, makerAtaB, provider.publicKey, 1_000_000_0);

    await mintTo(provider.connection, wallet.payer, mintA, takerAtaA, provider.publicKey, 1_000_000_0);
    await mintTo(provider.connection, wallet.payer, mintB, takerAtaB, provider.publicKey, 1_000_000_0);
  });

  it("Is initialized!", async () => {
    // Escrow is now the owner of mintA
    const vault = getAssociatedTokenAddressSync(mintA, escrow, true);
    const tx = await program.methods
    .make(seed, new anchor.BN(1_000_000), new anchor.BN(1_000_000))
    .accounts({
      maker: maker.publicKey,
      mintA,
      mintB,
      makerAtaA: makerAtaA,
      escrow,
      vaultA: vault,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([maker])
    // Skip simulation so that tx failures will show on blockchain logs.
    .rpc({skipPreflight: true});

    console.log("Your transaction signature", tx);
  });

  // it("Taker deposits and takes the escrow", async () => {

  //   const vault = getAssociatedTokenAddressSync(mintA, escrow, true);

  //   const tx = await program.methods.take().accounts({
  //     taker: taker.publicKey,
  //     maker: maker.publicKey,
  //     mintA,
  //     mintB,
  //     escrow,
  //     vault,
  //     makerAtaB,
  //     takerAtaA,
  //     takerAtaB,
  //     associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   })
  //   .signers([taker]).rpc();
  // });

  it("Refund Maker", async () => {

    const vault = getAssociatedTokenAddressSync(mintA, escrow, true);
    
    const tx = await program.methods.refund().accounts({
      maker: maker.publicKey,
      mintA,
      escrow,
      vault,
      makerAtaA,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    })
    .signers([maker]).rpc();
  });
});