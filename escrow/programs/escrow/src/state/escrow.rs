use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub seed: u64, // a new seed is passed with each Make init
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    // the one you are asking for
    pub amount_a: u64,
    pub bump: u8,
}

impl Space for Escrow {
    const INIT_SPACE: usize = 8 + 8 + 32 + 32 + 32 + 8 + 1;
}