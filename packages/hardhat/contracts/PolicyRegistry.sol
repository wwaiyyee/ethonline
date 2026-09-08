// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PolicyRegistry
 * @notice Hedera source of truth for EdGraph stablecoin coverage policies.
 *
 * The contract records policy terms and resolution state only. It never holds
 * premiums or executes payouts; the backend uses these terms to evaluate live
 * market observations and operators approve simulated recommendations.
 */
contract PolicyRegistry {
    struct Policy {
        address creator;
        string policyholder;
        string dataChainId;
        string stablecoinSymbol;
        address stablecoinAddress;
        address referencePoolAddress;
        uint256 thresholdBps;
        uint256 minimumDurationMinutes;
        uint256 payoutAmountBaseUnits;
        string payoutTokenSymbol;
        uint256 coverageStart;
        uint256 coverageEnd;
        uint256 maxEvidenceBudgetTinybar;
        bool active;
        bool resolved;
        bytes32 resolutionHash;
        bool exists;
    }

    uint256 public constant MAX_PAGE_SIZE = 50;
    uint256 private _nextNonce;
    mapping(bytes32 => Policy) private _policies;
    bytes32[] private _policyIds;

    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed creator,
        string policyholder,
        uint256 coverageStart,
        uint256 coverageEnd
    );
    event PolicyResolved(bytes32 indexed policyId, bytes32 indexed resolutionHash);

    error PolicyNotFound(bytes32 policyId);
    error PolicyAlreadyExists(bytes32 policyId);
    error NotPolicyCreator(bytes32 policyId, address caller);
    error InvalidPolicyTerms();
    error AlreadyResolved(bytes32 policyId);

    modifier onlyCreator(bytes32 policyId) {
        Policy storage policy = _policies[policyId];
        if (!policy.exists) revert PolicyNotFound(policyId);
        if (policy.creator != msg.sender) revert NotPolicyCreator(policyId, msg.sender);
        _;
    }

    function createPolicy(
        string calldata policyholder,
        string calldata dataChainId,
        string calldata stablecoinSymbol,
        address stablecoinAddress,
        address referencePoolAddress,
        uint256 thresholdBps,
        uint256 minimumDurationMinutes,
        uint256 payoutAmountBaseUnits,
        string calldata payoutTokenSymbol,
        uint256 coverageStart,
        uint256 coverageEnd,
        uint256 maxEvidenceBudgetTinybar
    ) external returns (bytes32 policyId) {
        if (
            bytes(policyholder).length == 0 ||
            bytes(dataChainId).length == 0 ||
            bytes(stablecoinSymbol).length == 0 ||
            bytes(payoutTokenSymbol).length == 0 ||
            thresholdBps == 0 ||
            thresholdBps > 10_000 ||
            minimumDurationMinutes == 0 ||
            coverageEnd <= coverageStart ||
            stablecoinAddress == address(0) ||
            referencePoolAddress == address(0) ||
            payoutAmountBaseUnits == 0 ||
            maxEvidenceBudgetTinybar == 0
        ) revert InvalidPolicyTerms();

        policyId = computePolicyId(msg.sender, _nextNonce++);
        if (_policies[policyId].exists) revert PolicyAlreadyExists(policyId);

        _policies[policyId] = Policy({
            creator: msg.sender,
            policyholder: policyholder,
            dataChainId: dataChainId,
            stablecoinSymbol: stablecoinSymbol,
            stablecoinAddress: stablecoinAddress,
            referencePoolAddress: referencePoolAddress,
            thresholdBps: thresholdBps,
            minimumDurationMinutes: minimumDurationMinutes,
            payoutAmountBaseUnits: payoutAmountBaseUnits,
            payoutTokenSymbol: payoutTokenSymbol,
            coverageStart: coverageStart,
            coverageEnd: coverageEnd,
            maxEvidenceBudgetTinybar: maxEvidenceBudgetTinybar,
            active: true,
            resolved: false,
            resolutionHash: bytes32(0),
            exists: true
        });
        _policyIds.push(policyId);
        emit PolicyCreated(policyId, msg.sender, policyholder, coverageStart, coverageEnd);
    }

    function computePolicyId(address creator, uint256 nonce) public pure returns (bytes32) {
        return keccak256(abi.encode(creator, nonce));
    }

    function resolvePolicy(bytes32 policyId, bytes32 resolutionHash) external onlyCreator(policyId) {
        Policy storage policy = _policies[policyId];
        if (policy.resolved) revert AlreadyResolved(policyId);
        if (resolutionHash == bytes32(0)) revert InvalidPolicyTerms();
        policy.resolved = true;
        policy.active = false;
        policy.resolutionHash = resolutionHash;
        emit PolicyResolved(policyId, resolutionHash);
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        Policy memory policy = _policies[policyId];
        if (!policy.exists) revert PolicyNotFound(policyId);
        return policy;
    }

    function getPolicyCount() external view returns (uint256) {
        return _policyIds.length;
    }

    function getPolicies(
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory ids, Policy[] memory policies) {
        if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
        if (offset >= _policyIds.length || limit == 0) return (new bytes32[](0), new Policy[](0));
        uint256 end = offset + limit;
        if (end > _policyIds.length) end = _policyIds.length;
        uint256 length = end - offset;
        ids = new bytes32[](length);
        policies = new Policy[](length);
        for (uint256 i = 0; i < length; i++) {
            bytes32 id = _policyIds[offset + i];
            ids[i] = id;
            policies[i] = _policies[id];
        }
    }
}
