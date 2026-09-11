import { expect } from "chai";
import { ethers } from "hardhat";
import type { PolicyRegistry } from "../typechain-types";

describe("PolicyRegistry", function () {
  async function deployFixture() {
    const [creator, other] = await ethers.getSigners();
    const registry = (await (await ethers.getContractFactory("PolicyRegistry")).deploy()) as PolicyRegistry;
    await registry.waitForDeployment();
    return { registry, creator, other };
  }

  const sample = {
    policyholder: "dao-demo",
    dataChainId: "base",
    stablecoinSymbol: "USDC",
    stablecoinAddress: "0x0000000000000000000000000000000000000001",
    referencePoolAddress: "0x0000000000000000000000000000000000000002",
    thresholdBps: 9800,
    minimumDurationMinutes: 30,
    payoutAmountBaseUnits: 1_000_000n,
    payoutTokenSymbol: "USDC",
    coverageStart: 1_000,
    coverageEnd: 10_000,
    maxEvidenceBudgetTinybar: 1_000_000n,
  };

  async function create(registry: PolicyRegistry) {
    return registry.createPolicy(
      sample.policyholder,
      sample.dataChainId,
      sample.stablecoinSymbol,
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

  it("creates and reads a policy", async function () {
    const { registry, creator } = await deployFixture();
    await expect(create(registry))
      .to.emit(registry, "PolicyCreated")
      .withArgs(
        await registry.computePolicyId(creator.address, 0),
        creator.address,
        sample.policyholder,
        sample.coverageStart,
        sample.coverageEnd,
      );
  });

  it("paginates policies", async function () {
    const { registry } = await deployFixture();
    await create(registry);
    await create(registry);
    expect(await registry.getPolicyCount()).to.equal(2n);
    const page = await registry.getPolicies(1, 1);
    expect(page[0]).to.have.length(1);
    expect(page[1][0].policyholder).to.equal(sample.policyholder);
  });

  it("allows the creator to resolve a policy", async function () {
    const { registry, creator, other } = await deployFixture();
    await create(registry);
    const policyId = await registry.computePolicyId(creator.address, 0);
    await expect(
      registry.connect(other).resolvePolicy(policyId, ethers.id("resolution")),
    ).to.be.revertedWithCustomError(registry, "NotPolicyCreator");
    await registry.resolvePolicy(policyId, ethers.id("resolution"));
    const policy = await registry.getPolicy(policyId);
    expect(policy.resolved).to.equal(true);
    expect(policy.active).to.equal(false);
  });
});
