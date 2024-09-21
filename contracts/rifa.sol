// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

contract Vaquinha is Ownable, VRFConsumerBase {
    uint256 public fee;
    bytes32 public keyHash;

    struct Campaign {
        address payable creator;
        uint256 prizeAmount;
        uint256 maxDonations;
        uint256 donationAmount;
        uint256 totalDonations;
        address[] donors;
        bool isCompleted;
        address winner;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;
    address payable public platformAddress;

    mapping(bytes32 => uint256) private requestIdToCampaignId;

    event CampaignCreated(uint256 campaignId, address creator);
    event DonationReceived(uint256 campaignId, address donor);
    event CampaignCompleted(uint256 campaignId, address winner);

    // Atualizamos o construtor para aceitar os parâmetros necessários para Ownable e VRFConsumerBase
    constructor(
        address _vrfCoordinator,
        address _linkToken,
        bytes32 _keyHash,
        uint256 _fee,
        address payable _platformAddress
    ) VRFConsumerBase(_vrfCoordinator, _linkToken) Ownable(msg.sender) {
        keyHash = _keyHash;
        fee = _fee;
        platformAddress = _platformAddress;
    }

    function createCampaign(
        uint256 _prizeAmount,
        uint256 _maxDonations,
        uint256 _donationAmount
    ) external payable returns (uint256) {
        require(
            msg.value == _prizeAmount,
            "Prize amount must be sent with the transaction"
        );
        require(_maxDonations > 0, "Max donations must be greater than zero");
        require(
            _donationAmount > 0,
            "Donation amount must be greater than zero"
        );

        campaignCount++;
        Campaign storage campaign = campaigns[campaignCount];
        campaign.creator = payable(msg.sender);
        campaign.prizeAmount = _prizeAmount;
        campaign.maxDonations = _maxDonations;
        campaign.donationAmount = _donationAmount;

        emit CampaignCreated(campaignCount, msg.sender);

        return campaignCount;
    }

    function donate(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.isCompleted, "Campaign is already completed");
        require(
            msg.value == campaign.donationAmount,
            "Incorrect donation amount"
        );
        require(
            campaign.totalDonations < campaign.maxDonations,
            "Maximum number of donations reached"
        );

        campaign.donors.push(msg.sender);
        campaign.totalDonations++;

        emit DonationReceived(_campaignId, msg.sender);

        if (campaign.totalDonations == campaign.maxDonations) {
            completeCampaign(_campaignId);
        }
    }

    function completeCampaign(uint256 _campaignId) internal {
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK to pay fee"
        );
        bytes32 requestId = requestRandomness(keyHash, fee);
        requestIdToCampaignId[requestId] = _campaignId;
        campaigns[_campaignId].isCompleted = true;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        uint256 campaignId = requestIdToCampaignId[requestId];
        Campaign storage campaign = campaigns[campaignId];
        uint256 winnerIndex = randomness % campaign.donors.length;
        address payable winner = payable(campaign.donors[winnerIndex]);
        campaign.winner = winner;

        // Transfer the prize amount to the winner
        winner.transfer(campaign.prizeAmount);

        uint256 totalCollected = campaign.donationAmount *
            campaign.maxDonations;
        uint256 platformFee = (totalCollected * 20) / 100;
        uint256 creatorAmount = totalCollected - platformFee;

        // Transfer 80% to the creator
        campaign.creator.transfer(creatorAmount);

        // Transfer 20% to the platform
        platformAddress.transfer(platformFee);

        emit CampaignCompleted(campaignId, winner);
    }

    function withdrawLink() external onlyOwner {
        LINK.transfer(owner(), LINK.balanceOf(address(this)));
    }
}