use anchor_lang::prelude::*;
#[account]
pub struct BetState {
    pub amount: u64,
    pub is_yes: bool,
    pub bump: u8
}

// 8 bytes for u64, 8 for anchor discriminator 
impl Space for BetState {
    const INIT_SPACE: usize = 8 + 8 + 8 + 1;
}