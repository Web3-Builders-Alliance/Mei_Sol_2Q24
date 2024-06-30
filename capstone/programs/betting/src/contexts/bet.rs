use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use anchor_spl::token_interface::TokenInterface;

use crate::{state::{Market,BetState}, errors::BettingError};

#[derive(Accounts)]
pub struct Bet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    #[account(
        seeds = [b"market", market.question.as_str().as_bytes()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,
    #[account(
        init_if_needed,
        payer = bettor,
        seeds = [market.key().as_ref(), bettor.key().as_ref()],
        bump,
        space = BetState::INIT_SPACE,
    )]
    pub bet_state: Account<'info, BetState>,
    #[account(mut)]
    #[account(
        seeds = [b"treasury", market.key().as_ref()],
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Bet<'info> {
    pub fn place_bet(&mut self, _amount: u64, is_yes: bool, bumps: &BetBumps) -> Result<()> {

        require!(self.bet_state.amount == 0, BettingError::AlreadyPlacedBet);

        self.bet_state.set_inner(BetState {
            maker: self.bettor.key(),
            amount: _amount,
            is_yes,
            bump: bumps.bet_state,
        });
        
        // TODO: SOL transfer, make it USDC later
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.bettor.to_account_info(),
            to: self.treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, _amount)?;
        Ok(())
    }
}