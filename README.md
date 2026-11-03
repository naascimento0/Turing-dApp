# Turing dApp

dApp de votação dos projetos finais com o token **Turing**, rodando na blockchain local do Hardhat.

- Contrato: [`contracts/Turing.sol`](contracts/Turing.sol)
- Frontend (React): [`frontend/`](frontend/)
- Testes: [`test/Turing.js`](test/Turing.js)

## Requisitos

- Node.js 18 ou 20
- MetaMask no navegador

## Como executar

Use três terminais, todos a partir da pasta `hardhat-turingdapp`.

**1. Instalar as dependências** (uma única vez)

```bash
npm install
cd frontend && npm install && cd ..
```

**2. Terminal 1: subir a blockchain local**

```bash
npx hardhat node
```

**3. Terminal 2: fazer o deploy do contrato**

```bash
npx hardhat --network localhost run scripts/deploy.js
```

O deploy grava o endereço e a ABI do contrato em `frontend/src/contracts/` e envia 100 ETH (para pagar o gas) para a conta da professora.

**4. Terminal 3: iniciar o frontend**

```bash
cd frontend
npm start
```

Acesse http://localhost:3000 e clique em **Connect Wallet**.

> Toda vez que o `npx hardhat node` é reiniciado, a blockchain volta do zero. Nesse caso:
> 1. Rode o deploy (passo 3) de novo.

## Configuração do MetaMask

**Rede:** adicione uma rede manualmente com estes dados:

| Campo | Valor |
|---|---|
| Nome | Hardhat Localhost |
| URL RPC | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Moeda | ETH |

**Contas de teste:** importe as contas abaixo pela chave privada (*Adicionar conta → Importar conta*). São as contas padrão do Hardhat, públicas e só para testes.

| Papel | Codinome | Endereço | Chave privada |
|---|---|---|---|
| Owner (superusuário) | — | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Aluno | nome1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Aluno | nome2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| Aluno | nome3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| Aluno | nome4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| Aluno | nome5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |

**Conta da professora:** o codinome `roberta` (`0x5025…3Df7`) também é superusuário e pode votar. Ela recebe ETH automaticamente no deploy. Para mandar ETH a qualquer outro endereço:

```bash
npx hardhat --network localhost faucet <endereco> --amount 10
```

## Testes

```bash
npx hardhat test
```
