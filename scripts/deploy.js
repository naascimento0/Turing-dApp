// Faz o deploy do contrato Turing e salva ABI + endereço no frontend.
// Uso: npx hardhat --network localhost run scripts/deploy.js
const path = require("path");
const fs = require("fs");

// Endereço da professora (não é uma conta padrão do Hardhat, então não tem ETH)
const PROFESSORA = "0x502542668aF09fa7aea52174b9965A7799343Df7";

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "Você está fazendo deploy na Hardhat Network temporária. " +
        "Use a opção '--network localhost'."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploy com a conta (owner):", deployer.address);

  const Turing = await ethers.getContractFactory("Turing");
  const turing = await Turing.deploy();
  await turing.deployed();
  console.log("Turing address:", turing.address);

  // Envia ETH para a professora poder pagar o gas das transações
  const tx = await deployer.sendTransaction({
    to: PROFESSORA,
    value: ethers.utils.parseEther("100"),
  });
  await tx.wait();
  console.log("100 ETH enviados para a professora:", PROFESSORA);

  saveFrontendFiles(turing);
}

function saveFrontendFiles(turing) {
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Turing: turing.address }, undefined, 2)
  );

  fs.writeFileSync(
    path.join(contractsDir, "Turing.json"),
    JSON.stringify(artifacts.readArtifactSync("Turing"), null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
