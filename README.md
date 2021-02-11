# On-chain Decentralized Order Book and Limit Order Matching Engine on Acala

### Matching Engine Function Calls

Create Trade Offer : Exchange Token1 (Sell) for Token2 (Buy).

```tradeOffer(address _tokenAddress1, uint _quantity1, address _tokenAddress2, uint _quantity2) returns (uint _id)```

Cancel Offer.

```cancelOffer(uint _id) ```

Create a Token Pair if it doesn't already exist.

```createTokenPair(address _tokenAddress1, address _tokenAddress2) ```

Get number of offers on the book for a given trading pair

```getOfferSize(address sellAddress, address buyAddress) public view returns (uint)```

Get the best offer on the book for a given trading pair

```getBestOffer(address sellAddress, address buyAddress) public view returns (uint)```

Navigate through the sorted Order book for a given pair

```
getNextOffer(uint id) public view returns(uint)
getPrevOffer(uint id) public view returns(uint)
```


### Matching Engine Algorithm

Orderbooks for buy/sell markets are implemented as two double-linked sorted lists. Match Engine tries to match any new offer with existing offers. If there is no match, the new offer is added to the orderbook. At any point in time, the liquidity of the exchange is directly proportional to number of existing offers in the buy/sell markets.

Let `tSellQuantity` be the amount taker is selling.
Let `tBuyQuantity` is the amount taker is buying.

Let `mSellQuantity` be the amount maker is selling.
Let `mBuyQuantity` is the amount maker is buying.

Check if `(tSellQuantity/tBuyQuantity >= mBuyQuantity/mSellQuantity)` is true. If true, internal function `buy(uint id, uint quantity) ` is called to execute transaction where `quantity` is `min(mSellQuantity,tBuyQuantity)`. `tSellQuantity` and `tBuyQuantity` are updated next. The loop exits if either of these values become zero, otherwise the next iteration is done.
