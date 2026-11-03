// Envia ETH (para pagar gas) a um endereço qualquer.
// Uso: npx hardhat --network localhost faucet <endereco> [--amount 10]
task("faucet", "Envia ETH para um endereço")
  .addPositionalParam("receiver", "Endereço que receberá o ETH")
  .addOptionalParam("amount", "Quantidade de ETH", "10")
  .setAction(async ({ receiver, amount }, { ethers }) => {
    const [sender] = await ethers.getSigners();
    const tx = await sender.sendTransaction({
      to: receiver,
      value: ethers.utils.parseEther(amount),
    });
    await tx.wait();
    console.log(`${amount} ETH enviados para ${receiver}`);
  });
