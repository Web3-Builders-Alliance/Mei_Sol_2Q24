use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;
use crate::{state::Market, errors::BettingError};

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
    // CHECK: WIP
    pub resolver: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Make<'info> {
    pub fn make(&mut self, question: String, fees_bps: Option<u16>, close_unix: Option<i64>, resolver: Pubkey, bumps: &MakeBumps) -> Result<()> {

        //TODO: this seems dumb. Store question offchain? 
        require!(question.len() > 0 && question.len() < 200, BettingError::QuestionTooLong);
        
        self.market.set_inner(Market {
            maker: self.maker.key(),
            question: question,
            fee_bps: fees_bps,
            close_unix: close_unix,
            bump: bumps.market,
            treasury_bump: bumps.treasury,
            resolver: resolver,
            resolved_as_yes: None,
        });

        Ok(())
    }

    pub fn resolve(&mut self, is_yes: bool) -> Result<()> {
        // TODO: better way of checking auth?
        require_keys_eq!(self.market.resolver, self.resolver.key(), BettingError::InvalidAuthority);

        self.market.resolved_as_yes =  Some(is_yes);
        Ok(())
    }
}