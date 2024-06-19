import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Betting } from "../target/types/betting";

describe("capstone", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Capstone as Program<Betting>;

  it("Make a market!", async () => {
    const tx = await program.methods
    .make("DJT is a memecoin started by Trump").rpc();
    console.log("Your transaction signature", tx);
  });
});
