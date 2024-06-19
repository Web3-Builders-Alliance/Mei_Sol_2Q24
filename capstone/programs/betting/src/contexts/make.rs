use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;

use crate::{state::Market, errors::BettingError};

#[derive(Accounts)]
#[instruction(params: MakeParams)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        seeds = [b"marketplace", params.question.as_str().as_bytes()],
        bump,
        space = Market::INIT_SPACE
    )]
    pub market: Account<'info, Market>,
    #[account(
        seeds = [b"treasury", market.key().as_ref()],
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Make<'info> {
    pub fn make(&mut self, params: MakeParams, bumps: &MakeBumps) -> Result<()> {

        require!(params.question.len() > 0 && params.question.len() < 200, BettingError::QuestionTooLong);
        
        self.market.set_inner(Market {
            maker: self.maker.key(),
            question: params.question,
            fee_bps: params.fee_bps,
            close_unix: params.close_unix,
            bump: bumps.market,
            treasury_bump: bumps.treasury,
        });

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MakeParams {
    question: String, 
    fee_bps: Option<u16>, 
    close_unix: Option<i64>, 
}