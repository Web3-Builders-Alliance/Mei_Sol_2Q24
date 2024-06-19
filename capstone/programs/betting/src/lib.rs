use anchor_lang::prelude::*;
declare_id!("7K322wtkQcjgaGL58LiNdscgMRd9TwWqRjghLbAnSVVV");

mod contexts;
mod state;
mod errors;
use contexts::*;
// use state::*;

#[program]
pub mod betting {
    use super::*;

    pub fn make(ctx: Context<Make>) -> Result<()> {
        Ok(())
    }
}