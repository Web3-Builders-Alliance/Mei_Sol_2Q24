use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("CgKbXAwH6BiAaotnCMNdZY8qWMQ8fg7Fuzaepze6gT5D");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Since the retun of this method is Result(),
        // which is the same of the function initialize Return, we don't have to use an Ok() here
        ctx.accounts.initialize(&ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)?;
        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close()?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        // Unique PDA for each user so passing in user key
        seeds = [b"state", user.key().as_ref()],
        bump,
        space = VaultState::INIT_SPACE
    )]
    pub vault_state: Account<'info, VaultState>,
    // Why does this one not have init
    #[account(
        seeds = [b"vault", vault_state.key().as_ref()],
        bump,
    )]
    // Q: Why is this a system account? Different from the other one?
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        // Why do we need to set the vault bump and state bump when initializing?
        self.vault_state.vault_bump = bumps.vault;
        self.vault_state.state_bump = bumps.vault_state;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        // b turns the string into a byte array
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
    )]
    pub vault_state: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    // Q: What is self here? Deposit struct
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

// n the Withdraw struct, user is marked with the Signer attribute. 
// This means that the transaction must be signed by the user's private key. 
// The user's key is also used as a seed to create a unique PDA
// Q: Does using it as seed make it such that only user can sign?
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        // b turns the string into a byte array
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
    )]
    pub vault_state: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        // Derive PDA
        let seeds = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        // why do we need a cpi to transfer?
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        // b turns the string into a byte array
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
        // closes the account and returns value in there to user. it also transfers the rent.
        close = user,
    )]
    pub vault_state: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Close<'info> {
    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        // Derive PDA
        let seeds = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        // Why do we need a signer seed here?
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        // why do we need a cpi to transfer?
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        // everything in the vault is transferred to the user
        transfer(cpi_ctx, self.vault.lamports())?;
        Ok(())
    }
}

#[account]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}

impl Space for VaultState {
    const INIT_SPACE: usize = 1 + 1 + 8;
}
