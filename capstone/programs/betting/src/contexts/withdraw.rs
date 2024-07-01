// use anchor_lang::prelude::*;
// use anchor_spl::token_interface::TokenInterface;
// use crate::{state::Market, errors::BettingError};

// #[derive(Accounts)]
// pub struct Withdraw<'info> {
//     #[account(mut)]
//     pub bettor: Signer<'info>,
//     pub market: Account<'info, Market>,
//     #[account(mut)]
//     pub treasury: SystemAccount<'info>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Interface<'info, TokenInterface>,
// }

// impl<'info> Withdraw<'info> {
//     pub fn Withdraw(&mut self, question: String, fees_bps: Option<u16>, close_unix: Option<i64>, resolver: Pubkey, bumps: &MakeBumps) -> Result<()> {

//        // get bettor's side of bet
        
     
//         Ok(())
//     }
// }