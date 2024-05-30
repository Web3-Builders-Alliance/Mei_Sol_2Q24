use anchor_lang:: prelude::*;

use anchor_spl::{associated_token::AssociatedToken, token::{transfer, Mint, Token, TokenAccount, Transfer}};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)] 
   pub taker: Signer<'info>,
   #[account(mut)] // Account needs to send asset out
   pub maker: SystemAccount<'info>, // why is this a SystemAccount
   pub mint_a: Account<'info, Mint>,
   pub mint_b: Account<'info, Mint>,
   // ?? What is this has_one matching?
   #[account(
        mut,
        // ensure there is a value in Escrow called mint_a,
        has_one = mint_a,  
        has_one = mint_b,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
        //?
        close = maker 
   )]
   pub escrow: Account<'info, Escrow>,

   #[account(mut, 
    associated_token::mint = mint_a,
    associated_token::authority = escrow,
    )]
   pub vault: Box<Account<'info, TokenAccount>>,
   
   #[account(
    init_if_needed,
    payer = taker, //not sure if maker has the ATA or not to receive the tokens.
    associated_token::mint = mint_b,
    associated_token::authority = maker
   )]
   pub maker_ata_b: Box<Account<'info, TokenAccount>>, 
   #[account(
    init_if_needed,
    payer = taker,
    associated_token::mint = mint_a,
    associated_token::authority = taker
   )]
   pub taker_ata_a: Box<Account<'info, TokenAccount>>, 
   // This checks that the taker is giving us the correct mint B that we wanted.  
   #[account(
    mut,
    associated_token::mint = mint_b,
    associated_token::authority = taker
   )]
   pub taker_ata_b: Account<'info, TokenAccount>,
   pub system_program: Program<'info, System>,
   pub token_program: Program<'info, Token>,
   pub associated_token_program: Program<'info, AssociatedToken>
}

impl <'info>Take<'info> {
    pub fn deposit(&mut self) -> Result<()>{
        // need this to transfer assets that is not native
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer{
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info()
        };

        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, self.escrow.amount_a)?;

        Ok(())
    }

    pub fn withdraw(&mut self) -> Result<()>{
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer{
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info()
        };

        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);
        transfer(cpi_context, self.escrow.amount_a)?;

        Ok(())
    }



}