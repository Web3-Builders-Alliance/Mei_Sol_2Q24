use anchor_lang::prelude::*;
use anchor_spl::{token::{transfer, Mint, Token, TokenAccount, Transfer}, associated_token::AssociatedToken};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: Account<'info, Mint>,

    #[account(
        mut, // to close it
        // There will be a variable with this name with the same value as the exact same mint_a passed in context.
        has_one = mint_a,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
        close = maker // transfer the rent to the maker
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        // if we don't add this, anyone can pass their own ATA
        associated_token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl <'info>Refund<'info> {
    pub fn refund(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        // Empty the vault
        transfer(cpi_ctx, self.vault.amount)?;
        Ok(())
    }
}