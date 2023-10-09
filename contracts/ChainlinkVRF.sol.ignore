// SPDX-License-Identifier: MIT
// https://docs.chain.link/vrf/v2/subscription
// https://testnet.bnbchain.org/faucet-smart
// https://faucets.chain.link/chapel
// https://vrf.chain.link/chapel

pragma solidity >= 0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract ChainlinkVRFv2 is VRFConsumerBaseV2 {
    uint64 internal s_subscriptionId = 2563;
    address internal vrfCoordinator = 0x6A2AAd07396B36Fe02a22b33cf443582f682c82f;
    bytes32 internal keyHash = 0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314;

    uint32 internal callbackGasLimit = 200000;
    uint16 internal requestConfirmations = 5;
    uint32 internal numWords = 2;

    uint256[] public s_randomWords;
    uint256 public s_requestId;
    address s_owner;

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    VRFCoordinatorV2Interface COORDINATOR;

    constructor() VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_owner = msg.sender;
    }

    function requestRandomWords() external onlyOwner {
        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        emit RequestSent(s_requestId, numWords);
    }

    function fulfillRandomWords(uint256, uint256[] memory _randomWords) internal override {
        s_randomWords = _randomWords;
        emit RequestFulfilled(s_requestId, _randomWords);
    }

    modifier onlyOwner() {
        require(msg.sender == s_owner);
        _;
    }
}
