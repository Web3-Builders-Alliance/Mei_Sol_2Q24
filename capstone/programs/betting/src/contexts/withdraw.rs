use crate::{
    errors::BettingError,
    state::{BetState, Market},
};
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::TokenInterface;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    #[account(mut, close = bettor)]
    pub bet_state: Account<'info, BetState>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self) -> Result<()> {
        require!(
            self.market.resolved_as_yes.is_some(),
            BettingError::NotResolved
        );
        require!(
            self.market.resolved_as_yes.unwrap() == self.bet_state.is_yes,
            BettingError::NotTheWinner
        );
        require!(self.bet_state.amount > 0, BettingError::NoBetPlaced);

        // If you get here, you are the winner.
        // Calculate share of side of pool and split pot amongst winners
        let total = self.market.yes_total + self.market.no_total;
        let share_of_winnings: u64 = match self.bet_state.is_yes == true {
            true => self.bet_state.amount / self.market.yes_total * total,
            false => self.bet_state.amount / self.market.no_total * total,
        };

        let seeds = &[
            &b"treasury"[..],
            &self.market.key().to_bytes(),
            &[self.market.treasury_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.treasury.to_account_info(),
            to: self.bettor.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        // transfer share of earnings to bettor
        transfer(cpi_ctx, share_of_winnings)?;

        // close bet state account
        // todo
        Ok(())
    }

}
