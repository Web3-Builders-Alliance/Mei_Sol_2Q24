import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Betting } from "../target/types/betting";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("capstone", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Betting as Program<Betting>;
  const maker = anchor.web3.Keypair.generate();

  // ?? Switch to generating market id 
  const market = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from("Test question")],
    program.programId
  )[0];

  const treasury = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("treasury"), 
    market.toBytes()], program.programId)[0];
  const systemProgram = anchor.web3.SystemProgram.programId

  before("Air drop to maker", async () => {
    const tx = await provider.connection.requestAirdrop(maker.publicKey, 1000000000);
    await provider.connection.confirmTransaction(tx);
    console.log("Maker balance: ", await provider.connection.getBalance(maker.publicKey));
  })

  it("Start a market", async () => {
    const feeBps = 100;  // Example fee in basis points
    const closeUnix = new anchor.BN(Math.floor(Date.now() / 1000));  // Current time in Unix timestamp
    
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
    console.log("Your transaction signature", tx);
    
    const marketState = await program.account.market.fetch(market);
    console.log("Market state", marketState);
  });

  it("Calculate spot price", async () => {
  });

  it("Place a bet yes", async () => {
  });

  it("Place a bet no", async () => {
  });

  it("Resolve bet", async () => {
  });


});
