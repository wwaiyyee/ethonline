// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PolicyRegistry
 * @notice Hedera source of truth for EdGraph's stablecoin coverage policies.
 *
 * The contract commits policy terms and operator resolutions only. It never
 * transfers payout assets: EdGraph's MVP produces a simulated recommendation
 * and waits for an off-chain DAO approval.
 */
contract PolicyRegistry {
    uint256 public constant MAX_PAGE_SIZE = 50;

    struct Policy {
        address policyholder;
        string dataChainId;
        address stablecoinAddress;
        address referencePoolAddress;
        uint16 thresholdBps;
        uint32 minimumDurationMinutes;
        uint256 payoutAmountBaseUnits;
        string payoutTokenSymbol;
        uint64 coverageStart;
        uint64 coverageEnd;
        uint256 maxEvidenceBudgetTinybar;
        bool active;
        bool resolved;
        bytes32 resolutionHash;
    }

    mapping(bytes32 policyId => Policy policy) private _policies;
    bytes32[] private _policyIds;

    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed policyholder,
        string dataChainId,
        address stablecoinAddress,
        address referencePoolAddress,
        uint16 thresholdBps,
        uint32 minimumDurationMinutes,
        uint256 payoutAmountBaseUnits,
        string payoutTokenSymbol,
        uint64 coverageStart,
        uint64 coverageEnd,
        uint256 maxEvidenceBudgetTinybar
    );
    event PolicyResolved(bytes32 indexed policyId, bytes32 indexed resolutionHash, bool approved);

    error PolicyAlreadyExists(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);
    error NotPolicyholder(bytes32 policyId, address caller);
    error InvalidPolicyTerms();
    error InvalidPage();

    modifier onlyPolicyholder(bytes32 policyId) {
        Policy storage policy = _policies[policyId];
        if (policy.policyholder == address(0)) revert PolicyNotFound(policyId);
        if (policy.policyholder != msg.sender) revert NotPolicyholder(policyId, msg.sender);
        _;
    }

    function computePolicyId(address policyholder, address referencePoolAddress, uint64 coverageStart) public pure returns (bytes32) {
        return keccak256(abi.encode(policyholder, referencePoolAddress, coverageStart));
    }

    function createPolicy(
        string calldata dataChainId,
        address stablecoinAddress,
        address referencePoolAddress,
        uint16 thresholdBps,
        uint32 minimumDurationMinutes,
        uint256 payoutAmountBaseUnits,
        string calldata payoutTokenSymbol,
        uint64 coverageStart,
        uint64 coverageEnd,
        uint256 maxEvidenceBudgetTinybar
    ) external returns (bytes32 policyId) {
        if (
            bytes(dataChainId).length == 0 ||
            stablecoinAddress == address(0) ||
            referencePoolAddress == address(0) ||
            thresholdBps == 0 ||
            thresholdBps > 10_000 ||
            minimumDurationMinutes == 0 ||
            coverageEnd <= coverageStart ||
            bytes(payoutTokenSymbol).length == 0
        ) revert InvalidPolicyTerms();

        policyId = computePolicyId(msg.sender, referencePoolAddress, coverageStart);
        if (_policies[policyId].policyholder != address(0)) revert PolicyAlreadyExists(policyId);

        _policies[policyId] = Policy({
            policyholder: msg.sender,
            dataChainId: dataChainId,
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
            resolutionHash: bytes32(0)
        });
        _policyIds.push(policyId);

        emit PolicyCreated(
            policyId,
            msg.sender,
            dataChainId,
            stablecoinAddress,
            referencePoolAddress,
            thresholdBps,
            minimumDurationMinutes,
            payoutAmountBaseUnits,
            payoutTokenSymbol,
            coverageStart,
            coverageEnd,
            maxEvidenceBudgetTinybar
        );
    }

    function resolvePolicy(bytes32 policyId, bytes32 resolutionHash, bool approved) external onlyPolicyholder(policyId) {
        if (resolutionHash == bytes32(0)) revert InvalidPolicyTerms();
        Policy storage policy = _policies[policyId];
        policy.active = false;
        policy.resolved = true;
        policy.resolutionHash = resolutionHash;
        emit PolicyResolved(policyId, resolutionHash, approved);
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        if (_policies[policyId].policyholder == address(0)) revert PolicyNotFound(policyId);
        return _policies[policyId];
    }

    function getPolicyCount() external view returns (uint256) {
        return _policyIds.length;
    }

    function getPolicies(uint256 offset, uint256 limit) external view returns (bytes32[] memory ids, Policy[] memory policies) {
        if (limit == 0 || limit > MAX_PAGE_SIZE || offset > _policyIds.length) revert InvalidPage();
        uint256 end = offset + limit;
        if (end > _policyIds.length) end = _policyIds.length;
        uint256 length = end - offset;
        ids = new bytes32[](length);
        policies = new Policy[](length);
        for (uint256 i = 0; i < length; i++) {
            bytes32 policyId = _policyIds[offset + i];
            ids[i] = policyId;
            policies[i] = _policies[policyId];
        }
    }
}

