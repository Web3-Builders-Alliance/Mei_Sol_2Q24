use anchor_lang::error_code;

#[error_code]
pub enum BettingError {
    // Maybe this is better saved off-chain
    #[msg("The question is too long")]
    QuestionTooLong,
    
    #[msg("Already placed a bet")]
    AlreadyPlacedBet,
}