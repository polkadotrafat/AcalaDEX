// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 < 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Dex is Ownable {

    using SafeMath for uint;

    bool rex;// re-entrance check

    struct OfferData {
        uint sellAmount;
        address sellTokenAddress;
        IERC20 sellToken;
        uint buyAmount;
        address buyTokenAddress;
        IERC20 buyToken;
        address who;
        uint timeStamp;
    }

    mapping (uint => OfferData) public offerList;

    uint public offerId;

    struct Token {
        string tokenName;
        string tokenSymbol;
        uint16 tokenIndex;
        address tokenAddress;
    }

    struct TokenPair {
        uint pairId;
        uint16 token1;
        uint16 token2;
    }

    struct ListInfo {
        uint nextOffer;
        uint prevOffer;
        uint deleted;
    }

    mapping (uint16 => Token) tokens;
    uint16 tokenIndex;
    mapping (address => bool) tokenList;
    mapping (address => uint16) tokenIndexList;

    // Address Balances
    mapping(address => mapping(uint16 => uint)) addressTokenBalance;

    //Ranked List and Token Pairs
    uint pairIndex;
    mapping(uint => ListInfo) public listRank;// List Info for a given ID
    mapping(address => mapping(address => uint)) public pairHighestOffer;
    mapping(address => mapping(address => uint)) public pairNumOffers;
    mapping(address => mapping(address => uint)) public pairID;
    mapping(address => mapping(address => bool)) public pairList;

    mapping(uint => TokenPair) tokenPairs;

    //Events List

    event TokenAdded(address _tokenAddress, string _tokenName, string _tokenSymbol, uint _timeStamp);

    event OrderAddedToMarketEscrow(uint indexed _id,address indexed _from, address _sellTokenAddress, address _buyTokenAddress,
     uint _sellAmount, uint _buyAmount, uint _timeStamp);
    event OrderCancelled(uint indexed _id, address indexed _from, address _sellTokenAddress, address _buyTokenAddress,
     uint _sellAmount, uint _buyAmount, uint _timeStamp );
    event OrderFulFilled(uint indexed _id, address indexed _owner, address _sellTokenAddress, address _buyTokenAddress,
     uint _sellAmount, uint _buyAmount, uint _timeStamp );

    // re-entry Check

    modifier reEntryCheck {
        require(!rex);
        rex = true;
        _;
        rex = false;
    }

    function addToken(address _tokenAddress, string memory _tokenName, string memory _tokenSymbol) public onlyOwner {
        require(tokenList[_tokenAddress] == false, "Token Already Exists");

        tokenList[_tokenAddress] = true;
        tokenIndex++;
        tokens[tokenIndex].tokenAddress = _tokenAddress;
        tokens[tokenIndex].tokenName = _tokenName;
        tokens[tokenIndex].tokenSymbol = _tokenSymbol;
        tokens[tokenIndex].tokenIndex = tokenIndex;
        tokenIndexList[_tokenAddress] = tokenIndex;
        emit TokenAdded(_tokenAddress,_tokenName,_tokenSymbol,now);
    }

    function getTotalTokens() public view returns (uint16) {
        return tokenIndex;
    }

    function getTokenBalance(address _tokenAddress) public view returns (uint) {
        require(tokenList[_tokenAddress] == true,"No token with this contract address exists.");
        uint16 tokenSymbolIndex = tokenIndexList[_tokenAddress];

        return addressTokenBalance[msg.sender][tokenSymbolIndex];
    }

    function getOfferId() internal returns(uint) {
        offerId++;
        return offerId;
    }
    //Limit Order Implementation
    function tradeOffer(address _tokenAddress1, uint _quantity1, address _tokenAddress2, uint _quantity2) public returns(uint) {
        require(pairList[_tokenAddress1][_tokenAddress2] == true,"This Token Pair Does not exist");
        require(!rex,"reentry not allowed");
        //RE-ENTRANCY CHECKS
        uint16 tokenSymbolIndex1 = tokenIndexList[_tokenAddress1];
        uint16 tokenSymbolIndex2 = tokenIndexList[_tokenAddress2];
        require(tokens[tokenSymbolIndex1].tokenAddress != address(0),"Address 0");
        require(tokens[tokenSymbolIndex2].tokenAddress != address(0),"Address 0");
        require(_quantity1 > 0,"Sell Amount should be > 0");
        require(_quantity2 > 0,"Buy Amount should be > 0");

        uint id = matchEngine(_tokenAddress1, _quantity1, _tokenAddress2,_quantity2);

        return id;
    }

    function createTokenPair(address _tokenAddress1, address _tokenAddress2) public {
        require(tokenList[_tokenAddress1] == true,"Token with this contract address not found.");
        require(tokenList[_tokenAddress2] == true,"Token with this contract address not found.");
        require(!pairList[_tokenAddress1][_tokenAddress2],"Token Pair already Exists");
        require(_tokenAddress1 != _tokenAddress2,"Token Pair is for two different tokens");

        pairIndex++;
        pairList[_tokenAddress1][_tokenAddress2] = true;
        pairList[_tokenAddress2][_tokenAddress1] = true;

        pairID[_tokenAddress1][_tokenAddress2] = pairIndex;
        pairID[_tokenAddress2][_tokenAddress1] = pairIndex;

        tokenPairs[pairIndex].pairId = pairIndex;
        uint16 id1 = tokenIndexList[_tokenAddress1];
        uint16 id2 = tokenIndexList[_tokenAddress2];

        tokenPairs[pairIndex].token1 = id1;
        tokenPairs[pairIndex].token2 = id2;

    }

    function getPairInfo(uint _id) public view returns (address,string memory,address,string memory) {
        return (tokens[tokenPairs[_id].token1].tokenAddress,tokens[tokenPairs[_id].token1].tokenSymbol,
        tokens[tokenPairs[_id].token2].tokenAddress,tokens[tokenPairs[_id].token2].tokenSymbol);
    }

    function getTotalPairs() public view returns (uint) {
        return pairIndex;
    }

    function getOfferSize(address sellAddress, address buyAddress) public view returns (uint) {
        return pairNumOffers[sellAddress][buyAddress];
    }

    function getOfferPerId(uint _id) public view returns (address,uint,address,uint) {
        OfferData memory offer = offerList[_id];

        return (offer.sellTokenAddress,offer.sellAmount,offer.buyTokenAddress,offer.buyAmount);
    }

    function getBestOffer(address sellAddress, address buyAddress) public view returns (uint) {
        return pairHighestOffer[sellAddress][buyAddress];
    }

    function getNextOffer(uint id) public view returns(uint) {
        return listRank[id].nextOffer;
    }

    function getPrevOffer(uint id) public view returns(uint) {
        return listRank[id].prevOffer;
    }

    function isIDSorted(uint id) internal view returns (bool) {
        address buyAddress = offerList[id].buyTokenAddress;
        address sellAddress = offerList[id].sellTokenAddress;
        bool isSorted = listRank[id].nextOffer != 0 || listRank[id].prevOffer != 0 ||
         pairHighestOffer[sellAddress][buyAddress] == id;

        return isSorted;
    }

    function sortList(uint id) internal {
        uint prevId = 0;
        uint x;
        address buyAddress = offerList[id].buyTokenAddress;
        address sellAddress = offerList[id].sellTokenAddress;

        x = findNext(id);

        if (x != 0) {
            prevId = listRank[x].prevOffer;
            listRank[x].prevOffer = id;
            listRank[id].nextOffer = x;
        } else {
            prevId = pairHighestOffer[sellAddress][buyAddress];
            pairHighestOffer[sellAddress][buyAddress] = id;
        }

        if (prevId != 0) {
            listRank[prevId].nextOffer = id;
            listRank[id].prevOffer = prevId;
        }

        pairNumOffers[sellAddress][buyAddress]++;
    }

    function unsortList(uint id) internal {
        address buyAddress = offerList[id].buyTokenAddress;
        address sellAddress = offerList[id].sellTokenAddress;

        require(pairNumOffers[sellAddress][buyAddress] > 0);
        require(listRank[id].deleted == 0 && isIDSorted(id),"The ID is not in the sorted list");

        if (id != pairHighestOffer[sellAddress][buyAddress]) {
            require(listRank[listRank[id].nextOffer].prevOffer == id);
            listRank[listRank[id].nextOffer].prevOffer = listRank[id].prevOffer;
        } else {
            pairHighestOffer[sellAddress][buyAddress] = listRank[id].prevOffer;
        }

        if (listRank[id].prevOffer != 0) {
            require(listRank[listRank[id].prevOffer].nextOffer == id);
            listRank[listRank[id].prevOffer].nextOffer = listRank[id].nextOffer;
        }

        pairNumOffers[sellAddress][buyAddress]--;
        listRank[id].deleted = 1;
    }

    function findNext(uint id) internal view returns(uint) {
        require(id > 0,"ID cannot be zero");

        uint highest = pairHighestOffer[offerList[id].sellTokenAddress][offerList[id].buyTokenAddress];
        uint prevHighest = 0;

        bool conditionCheck;

        uint m1 = offerList[id].buyAmount.mul(offerList[highest].sellAmount);
        uint m2 = offerList[highest].buyAmount.mul(offerList[id].sellAmount);

        conditionCheck = (m1 >= m2);

        while (highest != 0 && conditionCheck) {
            prevHighest = highest;
            highest = listRank[highest].prevOffer;

            m1 = offerList[id].buyAmount.mul(offerList[highest].sellAmount);
            m2 = offerList[highest].buyAmount.mul(offerList[id].sellAmount);

            conditionCheck = (m1 >= m2);
        }

        return prevHighest;

    }

    function createOffer(address _tokenAddress1, uint _quantity1, address _tokenAddress2, uint _quantity2) internal reEntryCheck returns (uint) {
        uint16 tokenSymbolIndex1 = tokenIndexList[_tokenAddress1];
        uint16 tokenSymbolIndex2 = tokenIndexList[_tokenAddress2];
        OfferData memory offer;

        offer.sellTokenAddress = _tokenAddress1;
        offer.buyTokenAddress = _tokenAddress2;
        offer.sellAmount = _quantity1;
        offer.buyAmount = _quantity2;
        offer.sellToken = IERC20(tokens[tokenSymbolIndex1].tokenAddress);
        offer.buyToken = IERC20(tokens[tokenSymbolIndex2].tokenAddress);
        offer.who = msg.sender;
        offer.timeStamp = now;

        require(offer.sellToken.transferFrom(msg.sender, address(this), _quantity1) == true,"Token Deposit Failed");
        uint id = getOfferId();

        offerList[id] = offer;

        emit OrderAddedToMarketEscrow(id, msg.sender, _tokenAddress1, _tokenAddress2, _quantity1, _quantity2, offer.timeStamp);

        return id;
    }

    function isActive(uint _id) public view returns (bool) {
        bool ret = offerList[_id].timeStamp > 0;
        return ret;
    }

    function deleteOffer(uint _id) internal {
        require(isActive(_id),"Transaction ID is Inactive or does not exist");
        delete offerList[_id];
    }

    function cancelOffer(uint _id) public returns (bool) {
        require(isActive(_id) && (offerList[_id].who == msg.sender),"Either the ID is inactive or the sender is unauthorized");
        unsortList(_id);
        OfferData memory offer = offerList[_id];
        delete offerList[_id];

        require(offer.sellToken.transfer(offer.who,offer.sellAmount));
        emit OrderCancelled(_id,offer.who,offer.sellTokenAddress,offer.buyTokenAddress,offer.sellAmount,offer.buyAmount,now);
        return true;
    }

    function buy(uint id, uint quantity) internal reEntryCheck {
        OfferData memory temp = offerList[id];

        if (quantity == offerList[id].sellAmount) {
            unsortList(id);
        }

        uint m1 = quantity.mul(temp.buyAmount);
        uint d1 = m1.div(temp.sellAmount);


        offerList[id].sellAmount = temp.sellAmount.sub(quantity);
        offerList[id].buyAmount = temp.buyAmount.sub(d1);
        require(temp.buyToken.transferFrom(msg.sender,temp.who,d1),"Token Buy Failed");
        require(temp.sellToken.transfer(msg.sender,quantity),"Token Sale Failed");

        if (offerList[id].sellAmount == 0) {
            deleteOffer(id);
            emit OrderFulFilled(id,temp.who,temp.sellTokenAddress,temp.buyTokenAddress,temp.sellAmount,temp.buyAmount,now);
        }
    }

    function matchEngine(address sellTokenAddress,uint tSellQuantity,address buyTokenAddress, uint tBuyQuantity) internal returns (uint) {
        uint mHighestId;
        uint tBuyQuantityPrev;
        uint mSellQuantity;
        uint mBuyQuantity;
        uint m1;
        uint m2;
        uint quantity;
        uint newId;

        while (pairHighestOffer[buyTokenAddress][sellTokenAddress] > 0) {
            mHighestId = pairHighestOffer[buyTokenAddress][sellTokenAddress];
            mBuyQuantity = offerList[mHighestId].buyAmount;
            mSellQuantity = offerList[mHighestId].sellAmount;

            m1 = tBuyQuantity.mul(mBuyQuantity);
            m2 = tSellQuantity.mul(mSellQuantity);

            if (m1 > m2) {
                break;
            }

            if (mSellQuantity < tBuyQuantity) {
                quantity = mSellQuantity;
            } else {
                quantity = tBuyQuantity;
            }

            buy(mHighestId,quantity);
            tBuyQuantityPrev = tBuyQuantity;

            if (mSellQuantity < tBuyQuantity) {
                quantity = mSellQuantity;
            } else {
                quantity = tBuyQuantity;
            }

            tBuyQuantity = tBuyQuantity.sub(quantity);

            m1 = tBuyQuantity.mul(tSellQuantity);

            tSellQuantity = m1.div(tBuyQuantityPrev);

            if (tSellQuantity == 0 || tBuyQuantity == 0) {
                break;
            }
        }

        if (tBuyQuantity > 0 && tSellQuantity > 0) {
            newId = createOffer(sellTokenAddress,tSellQuantity,buyTokenAddress,tBuyQuantity);
            sortList(newId);
        }

        return newId;
    }

}