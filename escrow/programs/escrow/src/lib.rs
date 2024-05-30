use anchor_lang::prelude::*;

declare_id!("3pRcdFhMfX7xEyqpPgwmbyURiC1woZ1GjoXE3XdhDFwM");

mod state;
mod contexts;

use contexts::*;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, amount_a: u64, deposit: u64) -> Result<()> {
        ctx.accounts.init(seed, amount_a, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)?;
        Ok(())
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw()?;
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund()?;
        Ok(())
    }
}
