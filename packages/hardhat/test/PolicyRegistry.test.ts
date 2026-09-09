import { expect } from "chai";
import { ethers } from "hardhat";
import type { PolicyRegistry } from "../typechain-types";

describe("PolicyRegistry", function () {
  async function deployFixture() {
    const [policyholder, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PolicyRegistry");
    const registry = (await factory.deploy()) as PolicyRegistry;
    await registry.waitForDeployment();
    return { registry, policyholder, other };
  }

  const sample = {
    dataChainId: "base",
    stablecoinAddress: "0x0000000000000000000000000000000000000001",
    referencePoolAddress: "0x0000000000000000000000000000000000000002",
    thresholdBps: 9800,
    minimumDurationMinutes: 30,
    payoutAmountBaseUnits: 1_000_000n,
    payoutTokenSymbol: "USDC",
    coverageStart: 1_700_000_000,
    coverageEnd: 1_800_000_000,
    maxEvidenceBudgetTinybar: 1_000_000n,
  };

  async function create(registry: PolicyRegistry) {
    return registry.createPolicy(
      sample.dataChainId,
      sample.stablecoinAddress,
      sample.referencePoolAddress,
      sample.thresholdBps,
      sample.minimumDurationMinutes,
      sample.payoutAmountBaseUnits,
      sample.payoutTokenSymbol,
      sample.coverageStart,
      sample.coverageEnd,
      sample.maxEvidenceBudgetTinybar,
    );
  }

  it("creates a policy and paginates it", async function () {
    const { registry, policyholder } = await deployFixture();
    const policyId = await registry.computePolicyId(policyholder.address, sample.referencePoolAddress, sample.coverageStart);
    await expect(create(registry)).to.emit(registry, "PolicyCreated").withArgs(
      policyId,
      policyholder.address,
      sample.dataChainId,
      sample.stablecoinAddress,
      sample.referencePoolAddress,
      sample.thresholdBps,
      sample.minimumDurationMinutes,
      sample.payoutAmountBaseUnits,
      sample.payoutTokenSymbol,
      sample.coverageStart,
      sample.coverageEnd,
      sample.maxEvidenceBudgetTinybar,
    );
    expect(await registry.getPolicyCount()).to.equal(1n);
    const page = await registry.getPolicies(0, 50);
    expect(page[0][0]).to.equal(policyId);
    expect(page[1][0].active).to.equal(true);
  });

  it("only lets the policyholder resolve a policy", async function () {
    const { registry, policyholder, other } = await deployFixture();
    await create(registry);
    const policyId = await registry.computePolicyId(policyholder.address, sample.referencePoolAddress, sample.coverageStart);
    const resolutionHash = ethers.id("simulated payout approved");
    await expect(registry.connect(other).resolvePolicy(policyId, resolutionHash, true))
      .to.be.revertedWithCustomError(registry, "NotPolicyholder")
      .withArgs(policyId, other.address);
    await registry.resolvePolicy(policyId, resolutionHash, true);
    const policy = await registry.getPolicy(policyId);
    expect(policy.active).to.equal(false);
    expect(policy.resolved).to.equal(true);
    expect(policy.resolutionHash).to.equal(resolutionHash);
  });

  it("rejects invalid terms", async function () {
    const { registry } = await deployFixture();
    await expect(
      registry.createPolicy(
        sample.dataChainId,
        sample.stablecoinAddress,
        sample.referencePoolAddress,
        10_001,
        sample.minimumDurationMinutes,
        sample.payoutAmountBaseUnits,
        sample.payoutTokenSymbol,
        sample.coverageStart,
        sample.coverageEnd,
        sample.maxEvidenceBudgetTinybar,
      ),
    ).to.be.revertedWithCustomError(registry, "InvalidPolicyTerms");
  });
});

