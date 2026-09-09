import * as fs from "fs";
import * as path from "path";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";
import { getDeployGasPrice } from "../utils/getDeployGasPrice";
import { resolveHederaContractId } from "../utils/resolveHederaContractId";

const HEDERA_CHAIN_IDS = new Set([295, 296]);

const deployPolicyRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const deployment = await hre.deployments.deploy("PolicyRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    gasLimit: "3000000",
    gasPrice: await getDeployGasPrice(hre),
  });

  const chainId = Number(await hre.network.provider.send("eth_chainId", []));
  if (!HEDERA_CHAIN_IDS.has(chainId) || !deployment.address) return;

  const hederaContractId = await resolveHederaContractId(deployment.address, chainId);
  const deploymentPath = path.join(hre.config.paths.deployments, hre.network.name, "PolicyRegistry.json");
  const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Record<string, unknown>;
  deploymentJson.hederaContractId = hederaContractId;
  fs.writeFileSync(deploymentPath, `${JSON.stringify(deploymentJson, null, 2)}\n`);
  console.log(`Resolved Hedera policy registry id: ${hederaContractId}`);
};

deployPolicyRegistry.tags = ["PolicyRegistry"];
export default deployPolicyRegistry;

