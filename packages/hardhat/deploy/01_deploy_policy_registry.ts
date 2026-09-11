import * as fs from "fs";
import * as path from "path";

import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

import { getDeployGasPrice } from "../utils/getDeployGasPrice";
import { resolveHederaContractId } from "../utils/resolveHederaContractId";

const HEDERA_CHAIN_IDS = new Set([295, 296]);

const deployPolicyRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const deployment = await deploy("PolicyRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    gasLimit: "3000000",
    gasPrice: await getDeployGasPrice(hre),
  });

  const numericChainId = Number(await hre.network.provider.send("eth_chainId", []));
  if (HEDERA_CHAIN_IDS.has(numericChainId) && deployment.address) {
    const hederaContractId = await resolveHederaContractId(deployment.address, numericChainId);
    const deploymentPath = path.join(hre.config.paths.deployments, hre.network.name, "PolicyRegistry.json");
    const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Record<string, unknown>;
    deploymentJson.hederaContractId = hederaContractId;
    fs.writeFileSync(deploymentPath, `${JSON.stringify(deploymentJson, null, 2)}\n`);
    console.log(`Resolved Hedera contract id: ${hederaContractId}`);
  }
};

deployPolicyRegistry.tags = ["PolicyRegistry"];
export default deployPolicyRegistry;
