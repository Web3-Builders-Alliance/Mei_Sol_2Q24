use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;

use crate::{state::{Market,BetState}, errors::BettingError};

#[derive(Accounts)]
#[instruction(question: String)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    // ?? refactor to use id as seed?
    #[account(
        init,
        payer = maker,
        seeds = [b"market", question.as_str().as_bytes()],
        bump,
        space = Market::INIT_SPACE
    )]
    pub market: Account<'info, Market>,
    #[account(
        seeds = [b"treasury", market.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    pub bet_state: Account<'info, BetState>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Make<'info> {
    pub fn make(&mut self, question: String, fees_bps: Option<u16>, close_unix: Option<i64>, bumps: &MakeBumps) -> Result<()> {

        require!(question.len() > 0 && question.len() < 200, BettingError::QuestionTooLong);
        
        self.market.set_inner(Market {
            maker: self.maker.key(),
            question: question,
            fee_bps: fees_bps,
            close_unix: close_unix,
            bump: bumps.market,
            treasury_bump: bumps.treasury,
        });

        Ok(())
    }
}