use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub maker: Pubkey,
    pub fee_bps: Option<u16>,// expired in unix timestamp
    pub close_unix: Option<i64>, 
    pub bump: u8,
    pub treasury_bump: u8,
    // Set the limit to 200 bytes which should fit a simple q? 
    // Prob should save it offchain but this should work for now?
    pub question: String, 
    pub resolver: Pubkey,
    pub resolved_as_yes: Option<bool>,
    // ?? is there a better way of tracking this?
    pub yes_total: u64,
    pub no_total: u64,
}

impl Space for Market {
    const INIT_SPACE: usize = 8 + (1 + 2) + (1 + 8) + 1 + 1 + (4 + 200) + 32 + (1 + 1);
}
