const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const T = (n) => ethers.utils.parseEther(String(n)); // n Turings
const PROFESSORA = "0x502542668aF09fa7aea52174b9965A7799343Df7";

describe("Turing", function () {
  async function deployFixture() {
    const [owner, nome1, nome2, nome3, nome4, nome5, outsider] = await ethers.getSigners();
    const turing = await (await ethers.getContractFactory("Turing")).deploy();
    await turing.deployed();
    return { turing, owner, nome1, nome2, nome3, nome4, nome5, outsider };
  }

  describe("Deploy", function () {
    it("não emite tokens no construtor", async function () {
      const { turing, owner } = await loadFixture(deployFixture);
      expect(await turing.totalSupply()).to.equal(0);
      expect(await turing.balanceOf(owner.address)).to.equal(0);
    });

    it("inicializa os usuários da tabela e voting = true", async function () {
      const { turing, nome1, nome5 } = await loadFixture(deployFixture);
      expect(await turing.users("roberta")).to.equal(PROFESSORA);
      expect(await turing.users("nome1")).to.equal(nome1.address);
      expect(await turing.users("nome5")).to.equal(nome5.address);
      expect(await turing.getCodinomes()).to.deep.equal(
        ["roberta", "nome1", "nome2", "nome3", "nome4", "nome5"]
      );
      expect(await turing.voting()).to.equal(true);
    });
  });

  describe("Funções de superusuário", function () {
    it("só owner ou professora podem chamar", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      const t = turing.connect(nome1);
      const msg = "Apenas o owner ou a professora";
      await expect(t.updateUser("x", nome1.address)).to.be.revertedWith(msg);
      await expect(t.votingOn()).to.be.revertedWith(msg);
      await expect(t.votingOff()).to.be.revertedWith(msg);
      await expect(t.issueToken("nome2", T(1))).to.be.revertedWith(msg);
    });

    it("a professora é superusuária", async function () {
      const { turing, owner } = await loadFixture(deployFixture);
      await owner.sendTransaction({ to: PROFESSORA, value: T(1) });
      await ethers.provider.send("hardhat_impersonateAccount", [PROFESSORA]);
      const prof = await ethers.getSigner(PROFESSORA);
      await turing.connect(prof).votingOff();
      expect(await turing.voting()).to.equal(false);
    });

    it("updateUser rejeita codinome vazio e atualiza/adiciona usuários", async function () {
      const { turing, outsider, nome1 } = await loadFixture(deployFixture);
      await expect(turing.updateUser("", outsider.address)).to.be.revertedWith("Codinome vazio");
      await turing.updateUser("nome1", outsider.address);
      expect(await turing.users("nome1")).to.equal(outsider.address);
      expect(await turing.codinomeOf(nome1.address)).to.equal("");
      await turing.updateUser("nome6", nome1.address);
      expect((await turing.getCodinomes()).length).to.equal(7);
    });

    it("votingOn/votingOff alteram voting", async function () {
      const { turing } = await loadFixture(deployFixture);
      await turing.votingOff();
      expect(await turing.voting()).to.equal(false);
      await turing.votingOn();
      expect(await turing.voting()).to.equal(true);
    });

    it("issueToken cria Turings no codinome", async function () {
      const { turing, nome2 } = await loadFixture(deployFixture);
      await expect(turing.issueToken("nome2", T(5)))
        .to.emit(turing, "TokenIssued").withArgs("nome2", T(5));
      expect(await turing.balanceOf(nome2.address)).to.equal(T(5));
      expect(await turing.totalSupply()).to.equal(T(5));
      await expect(turing.issueToken("ninguem", T(1))).to.be.revertedWith("Codinome nao cadastrado");
    });
  });

  describe("vote", function () {
    it("cria Turings para o votado", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployFixture);
      await expect(turing.connect(nome1).vote("nome2", T(1.5)))
        .to.emit(turing, "Voted").withArgs("nome1", "nome2", T(1.5));
      expect(await turing.balanceOf(nome2.address)).to.equal(T(1.5));
      expect(await turing.hasVote("nome1", "nome2")).to.equal(true);
    });

    it("exige votação ativa", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await turing.votingOff();
      await expect(turing.connect(nome1).vote("nome2", T(1))).to.be.revertedWith("Votacao pausada");
    });

    it("exige usuário autorizado", async function () {
      const { turing, owner, outsider } = await loadFixture(deployFixture);
      await expect(turing.connect(outsider).vote("nome2", T(1))).to.be.revertedWith("Usuario nao autorizado");
      await expect(turing.connect(owner).vote("nome2", T(1))).to.be.revertedWith("Usuario nao autorizado");
    });

    it("não permite votar em si mesmo", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await expect(turing.connect(nome1).vote("nome1", T(1))).to.be.revertedWith("Nao pode votar em si mesmo");
    });

    it("exige 0 < quantidade <= 2 Turings", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      const msg = "Quantidade deve ser > 0 e <= 2 Turings";
      await expect(turing.connect(nome1).vote("nome2", 0)).to.be.revertedWith(msg);
      await expect(turing.connect(nome1).vote("nome2", T(2).add(1))).to.be.revertedWith(msg);
      await turing.connect(nome1).vote("nome2", T(2));
    });

    it("só permite um voto por codinome", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await turing.connect(nome1).vote("nome2", T(1));
      await expect(turing.connect(nome1).vote("nome2", T(1))).to.be.revertedWith("Ja votou neste codinome");
      await turing.connect(nome1).vote("nome3", T(1));
    });

    it("a cada 10 votos o votante recebe 1 Turing", async function () {
      const { turing, nome1, outsider } = await loadFixture(deployFixture);
      const wallets = Array.from({ length: 10 }, () => ethers.Wallet.createRandom());
      for (let i = 0; i < 10; i++) {
        await turing.updateUser(`extra${i}`, wallets[i].address);
      }
      for (let i = 0; i < 9; i++) {
        await turing.connect(nome1).vote(`extra${i}`, T(1));
      }
      expect(await turing.balanceOf(nome1.address)).to.equal(0);
      await turing.connect(nome1).vote("extra9", T(1));
      expect(await turing.balanceOf(nome1.address)).to.equal(T(1));
      expect(await turing.voteCount("nome1")).to.equal(10);
    });
  });
});
