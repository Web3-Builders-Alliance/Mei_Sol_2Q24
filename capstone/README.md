## A basic betting program

Devnet program id: 9C68oQe7KLvqDpm1FgP2vsZEsMXodd9qDEqvccbN1S9R
[Solscan Link](https://solscan.io/account/9C68oQe7KLvqDpm1FgP2vsZEsMXodd9qDEqvccbN1S9R?cluster=devnet)

Flow:
- Anyone can open a market with a Yes/No question and specify a resolver
- Bettors can bet an amount for Yes or No
- The resolver resolves the market (yes or no result)
- Winners split the pot in the treasury according to their proportional share in the winning pool

See tests/betting.ts for proof of concept