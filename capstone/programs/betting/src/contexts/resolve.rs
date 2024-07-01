use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;
use crate::{state::Market, errors::BettingError};

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    // ?? refactor to use id as seed?
    #[account(mut)]
    pub market: Account<'info, Market>
}

impl<'info> Resolve<'info> {
    pub fn resolve_market(&mut self, is_yes: bool) -> Result<()> {
        // TODO: better way of checking auth?
        require_keys_eq!(self.market.resolver, self.resolver.key(), BettingError::InvalidAuthority);
        require!(self.market.resolved_as_yes.is_none(), BettingError::AlreadyResolved);

        self.market.resolved_as_yes =  Some(is_yes);
        Ok(())
    }
}