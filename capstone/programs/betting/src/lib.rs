use anchor_lang::prelude::*;
declare_id!("9C68oQe7KLvqDpm1FgP2vsZEsMXodd9qDEqvccbN1S9R");

mod contexts;
mod state;
mod errors;
use contexts::*;
// mod helpers;

#[program]
pub mod betting {

    use anchor_lang::solana_program::pubkey;

    use super::*;

    pub fn make(ctx: Context<Make>, question: String, fees_bps: Option<u16>, close_unix: Option<i64>, resolver: Pubkey) -> Result<()> {
        ctx.accounts.make(question, fees_bps, close_unix, resolver, &ctx.bumps)?;
        Ok(())
    }

    pub fn place_bet(ctx: Context<Bet>, amount: u64, is_yes: bool) -> Result<()> {
        ctx.accounts.place_bet(amount, is_yes, &ctx.bumps)?;
        Ok(())
    }
}