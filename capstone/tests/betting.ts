import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Betting } from "../target/types/betting";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

describe("capstone", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Betting as Program<Betting>;
  const maker = anchor.web3.Keypair.generate();
  const bettorA = anchor.web3.Keypair.generate();
  console.log("Maker", maker.publicKey.toBase58());
  console.log("Bettor A", bettorA.publicKey.toBase58());

  // ?? Switch to generating market id
  const market = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from("Test question")],
    program.programId
  )[0];

  const treasury = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), market.toBuffer()],
    program.programId
  )[0];
  const systemProgram = anchor.web3.SystemProgram.programId;

  before("Air drop to users", async () => {
    const tx = await provider.connection.requestAirdrop(
      maker.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(tx);
    console.log(
      "Maker balance: ",
      await provider.connection.getBalance(maker.publicKey)
    );

    const tx2 = await provider.connection.requestAirdrop(
      bettorA.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(tx2);
  });

  it("Start a market", async () => {
    const feeBps = 100; // Example fee in basis points
    const closeUnix = new anchor.BN(Math.floor(Date.now() / 1000)); // Current time in Unix timestamp

    // Call the make method
    const tx = await program.methods
      .make("Test question", feeBps, closeUnix)
      .accountsPartial({
        maker: maker.publicKey,
        market,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    // console.log("Your transaction signature", tx);

    const marketState = await program.account.market.fetch(market);
    console.log("Market state", marketState);
  });

  it("User A Place a bet yes", async () => {
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    const betStatePda = anchor.web3.PublicKey.findProgramAddressSync(
      [market.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    )[0];

    const tx = await program.methods
      .placeBet(amount, true)
      .accountsPartial({
        bettor: bettorA.publicKey,
        market,
        betState: betStatePda,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bettorA])
      .rpc();

    // const bet = await program.account.betState.fetch(betStatePda);
    // console.log("Bet state", bet);
  });

  it("User A cannot place a second bet", async () => {
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    const betStatePda = anchor.web3.PublicKey.findProgramAddressSync(
      [market.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    )[0];

    try {
    const tx = await program.methods
      .placeBet(amount, false)
      .accountsPartial({
        bettor: bettorA.publicKey,
        market,
        betState: betStatePda,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bettorA])
      .rpc();
    } catch (error) {
      const anchorError = error as anchor.AnchorError
      expect(anchorError.error.errorCode.code == 'AlreadyPlacedBet');
    }
  });

  it("User B Place a bet yes", async () => {});

  it("Resolve bet", async () => {});

  it("Withdraw earnings", async () => {});
});
