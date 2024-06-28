use anchor_lang::prelude::*;
declare_id!("9C68oQe7KLvqDpm1FgP2vsZEsMXodd9qDEqvccbN1S9R");

mod contexts;
mod state;
mod errors;
use contexts::*;
// use state::*;

#[program]
pub mod betting {

    use super::*;

    pub fn make(ctx: Context<Make>, question: String, fees_bps: Option<u16>, close_unix: Option<i64>) -> Result<()> {
        ctx.accounts.make(question, fees_bps, close_unix, &ctx.bumps)?;
        Ok(())
    }

    pub fn place_bet(ctx: Context<Bet>, amount: u64, is_yes: bool) -> Result<()> {
        ctx.accounts.place_bet(amount, is_yes, &ctx.bumps)?;
        Ok(())
    }
}