use anchor_lang::prelude::*;
use anchor_spl::{token::{transfer, Mint, Token, TokenAccount, Transfer}, associated_token::AssociatedToken};

use crate::state::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(
        init, 
        payer = maker, 
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()], // one maker with multiple escrow
        bump,
        space = Escrow::INIT_SPACE
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: Account<'info, TokenAccount>, // maker ata
    #[account(
        init, 
        payer = maker, 
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault_a: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    // Save the seed in the context so we can get it back later
    pub fn init(&mut self, seed: u64, amount_a: u64, bumps: &MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed,
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            amount_a,
            bump: bumps.escrow,
        });
        
        Ok(())
    }

    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.maker_ata_a.to_account_info(),
            to: self.vault_a.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, deposit)?;

        Ok(())
    }
}

