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
  const bettorB = anchor.web3.Keypair.generate();
  const resolver = anchor.web3.Keypair.generate();
  console.log("Maker", maker.publicKey.toBase58());
  console.log("Bettor A", bettorA.publicKey.toBase58());
  console.log("Bettor B", bettorB.publicKey.toBase58());
  console.log("Resolver", bettorB.publicKey.toBase58());

  // ?? Switch to generating market id
  const marketPda = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from("Test question")],
    program.programId
  )[0];
  console.log("Market PDA", marketPda.toBase58());

  const treasury = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketPda.toBuffer()],
    program.programId
  )[0];console.log("Treasury PDA", treasury.toBase58());
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

    await provider.connection.requestAirdrop(
      bettorA.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.requestAirdrop(
      bettorB.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    );
  });

  it("Start a market", async () => {
    const feeBps = 100; // Example fee in basis points
    const closeUnix = new anchor.BN(Math.floor(Date.now() / 1000)); // Current time in Unix timestamp

    // Call the make method
    const tx = await program.methods
      .make("Test question", feeBps, closeUnix, resolver.publicKey)
      .accountsPartial({
        maker: maker.publicKey,
        market: marketPda,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    // console.log("Your transaction signature", tx);

    const marketState = await program.account.market.fetch(marketPda);
    console.log("Market state", marketState);
  });

  it("User A Place a bet yes", async () => {
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    const betStatePda = anchor.web3.PublicKey.findProgramAddressSync(
      [marketPda.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    )[0];

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury)

    const tx = await program.methods
      .placeBet(amount, true)
      .accountsPartial({
        bettor: bettorA.publicKey,
        market: marketPda,
        betState: betStatePda,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bettorA])
      .rpc();
    
    const bet = await program.account.betState.fetch(betStatePda);
    console.log("Bet state for user A", betStatePda);
    
    // Confirm that the treasury balance has increased by the amount bet
    const treasuryBalanceAfter = await provider.connection.getBalance(treasury)
    expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(amount.toNumber())
    
    // Confirm that the market state has been updated with side of bet
    const marketState = await program.account.market.fetch(marketPda);
    expect(marketState.yesTotal.toNumber()).to.equal(amount.toNumber());
    expect(marketState.noTotal.toNumber()).to.equal(0);
  });

  it("User A cannot place a second bet", async () => {
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    const betStatePda = anchor.web3.PublicKey.findProgramAddressSync(
      [marketPda.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    )[0];

    try {
      const tx = await program.methods
        .placeBet(amount, false)
        .accountsPartial({
          bettor: bettorA.publicKey,
          market: marketPda,
          betState: betStatePda,
          treasury,
          systemProgram,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bettorA])
        .rpc();
    } catch (error) {
      const anchorError = error as anchor.AnchorError;
      expect(anchorError.error.errorCode.code == "AlreadyPlacedBet");
    }
  });

  it("User B Place a bet no", async () => {
    const amount = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL);

    const betStatePda = anchor.web3.PublicKey.findProgramAddressSync(
      [marketPda.toBuffer(), bettorB.publicKey.toBuffer()],
      program.programId
    )[0];

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury)

    const tx = await program.methods
      .placeBet(amount, false)
      .accountsPartial({
        bettor: bettorB.publicKey,
        market: marketPda,
        betState: betStatePda,
        treasury,
        systemProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bettorB])
      .rpc();
      
      const bet = await program.account.betState.fetch(betStatePda);
      console.log("Bet state for user B", bet);

      const treasuryBalanceAfter = await provider.connection.getBalance(treasury)
      console.log("Updated treasury after user B", treasuryBalanceAfter);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(amount.toNumber())

      // Confirm that the market state has been updated with side of bet
      const marketState = await program.account.market.fetch(marketPda);
      expect(marketState.noTotal.toNumber()).to.equal(amount.toNumber());

      // previous state remains the same
      expect(marketState.yesTotal.toNumber()).to.equal(1 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("Resolve bet yes", async () => {
    const marketStateBefore = await program.account.market.fetch(marketPda);
    expect(marketStateBefore.resolvedAsYes).to.be.null;

    const tx = await program.methods.resolveMarket(true)
    .accounts({
      resolver: resolver.publicKey, 
      market: marketPda,
    })
    .signers([resolver])
    .rpc()

    console.log("Market resolved", tx)
    const marketState = await program.account.market.fetch(marketPda);
    expect(marketState.resolvedAsYes).to.be.true;
  });

  it("Resolve bet no", async () => {
  });

  it("Should throw error if already resolved", async () => {
  });

  it("Should throw error if initiated by non-resolver", async () => {
  });

  it("Withdraw earnings", async () => {
   
  });
});
