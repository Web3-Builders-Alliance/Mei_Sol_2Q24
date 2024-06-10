import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";

describe("amm", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Amm as Program<Amm>;
  const maker = anchor.web3.Keypair.generate();
  const seed = 

//   pub fn initialize(ctx: Context<Initialize>, seed: u64, fee:u16, authority: Option<Pubkey>) -> Result<()> {
//     ctx.accounts.init(&ctx.bumps, seed, fee, authority)
// }
  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await 
    program.methods.initialize()
    .accountsPartial()
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
