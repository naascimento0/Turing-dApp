import React, { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { TuringForm } from "./TuringForm";
import { Ranking } from "./Ranking";

const HARDHAT_CHAIN_ID = "0x7a69"; // 31337
const PROFESSORA = "roberta";

// Extrai a mensagem do require() que reverteu, nos vários formatos de erro
// que o MetaMask/ethers podem retornar.
function errorMessage(error) {
  const raw =
    error?.error?.data?.message ||
    error?.data?.message ||
    error?.error?.message ||
    error?.reason ||
    error?.message ||
    String(error);
  const match = raw.match(/reverted with reason string '([^']*)'/);
  return match ? match[1] : raw;
}

export function Dapp() {
  const [address, setAddress] = useState();
  const [contract, setContract] = useState();
  const [info, setInfo] = useState(); // { codinome, isSuperUser, voting, ranking }
  const [networkError, setNetworkError] = useState();
  const [txBeingSent, setTxBeingSent] = useState();
  const [txError, setTxError] = useState();
  const [txSuccess, setTxSuccess] = useState();
  const addressRef = useRef();

  // Lê do contrato tudo o que a interface precisa
  const refresh = useCallback(async (turing, userAddress) => {
    const [codinomes, codinome, isSuperUser, voting] = await Promise.all([
      turing.getCodinomes(),
      turing.codinomeOf(userAddress),
      turing.isSuperUser(userAddress),
      turing.voting(),
    ]);
    const ranking = await Promise.all(
      codinomes.map(async (c) => {
        const addr = await turing.users(c);
        const balance =
          addr === ethers.constants.AddressZero
            ? ethers.constants.Zero
            : await turing.balanceOf(addr);
        return { codinome: c, address: addr, balance };
      })
    );
    ranking.sort((a, b) => (b.balance.gt(a.balance) ? 1 : b.balance.lt(a.balance) ? -1 : 0));
    setInfo({ codinome, isSuperUser, voting, ranking });
  }, []);

  const initialize = useCallback(
    async (userAddress) => {
      addressRef.current = userAddress;
      setAddress(userAddress);
      setInfo(undefined);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if ((await provider.getCode(contractAddress.Turing)) === "0x") {
        setAddress(undefined);
        setNetworkError(
          "Contrato Turing não encontrado nesta rede. Rode o deploy " +
            "(npx hardhat --network localhost run scripts/deploy.js) e recarregue a página."
        );
        return;
      }

      const turing = new ethers.Contract(
        contractAddress.Turing,
        TuringArtifact.abi,
        provider.getSigner(0)
      );
      setContract(turing);
      await refresh(turing, userAddress);
    },
    [refresh]
  );

  // Ranking via eventos: toda emissão de Turings (Transfer), mudança de
  // status da votação ou de usuário dispara uma atualização da interface.
  useEffect(() => {
    if (!contract) return;
    const onEvent = () => refresh(contract, addressRef.current);
    contract.on("Transfer", onEvent);
    contract.on("VotingStatusChanged", onEvent);
    contract.on("UserUpdated", onEvent);
    return () => contract.removeAllListeners();
  }, [contract, refresh]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = ([newAddress]) => {
      if (!addressRef.current) return;
      if (newAddress === undefined) {
        addressRef.current = undefined;
        setAddress(undefined);
        setContract(undefined);
        setInfo(undefined);
      } else {
        initialize(newAddress);
      }
    };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [initialize]);

  async function connectWallet() {
    setNetworkError(undefined);
    try {
      const [selected] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== HARDHAT_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      }
      await initialize(selected);
    } catch (error) {
      setNetworkError(
        "Não foi possível conectar. Verifique se a rede Localhost 8545 " +
          "(chain ID 31337) está configurada no MetaMask. " + errorMessage(error)
      );
    }
  }

  async function sendTx(description, fn) {
    setTxError(undefined);
    setTxSuccess(undefined);
    try {
      const tx = await fn();
      setTxBeingSent(tx.hash);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Transação revertida");
      setTxSuccess(description);
      await refresh(contract, address);
    } catch (error) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") return;
      setTxError(errorMessage(error));
    } finally {
      setTxBeingSent(undefined);
    }
  }

  if (window.ethereum === undefined) return <NoWalletDetected />;

  if (!address) {
    return (
      <ConnectWallet
        connectWallet={connectWallet}
        networkError={networkError}
        dismiss={() => setNetworkError(undefined)}
      />
    );
  }

  if (!info) return <Loading />;

  const { codinome, isSuperUser, voting, ranking } = info;
  // Codinomes de alunos (sem a professora) para os campos de seleção
  const alunos = ranking.map((r) => r.codinome).filter((c) => c !== PROFESSORA).sort();
  const candidatos = alunos.filter((c) => c !== codinome);

  return (
    <div className="container p-4">
      <h1>Turing dApp</h1>
      <p>
        Conta: <b>{address}</b>
        <br />
        Codinome: <b>{codinome || "(não cadastrado)"}</b>
        {isSuperUser && <span className="badge badge-danger ml-2">Superusuário</span>}
        <br />
        Votação:{" "}
        {voting ? (
          <span className="badge badge-success">ATIVA</span>
        ) : (
          <span className="badge badge-secondary">PAUSADA</span>
        )}
      </p>

      {txBeingSent && <WaitingForTransactionMessage txHash={txBeingSent} />}
      {txError && (
        <TransactionErrorMessage message={txError} dismiss={() => setTxError(undefined)} />
      )}
      {txSuccess && (
        <div className="alert alert-success">
          {txSuccess}
          <button type="button" className="close" onClick={() => setTxSuccess(undefined)}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          {codinome ? (
            <TuringForm
              title="Votar"
              buttonLabel="Votar"
              codinomes={candidatos}
              maxAmount="2"
              disabled={!!txBeingSent}
              onSubmit={(c, amount) =>
                sendTx(`Voto em ${c} registrado.`, () => contract.vote(c, amount))
              }
            />
          ) : (
            <div className="alert alert-warning">
              Esta conta não é um usuário cadastrado, por isso não pode votar.
            </div>
          )}

          {isSuperUser && (
            <>
              <TuringForm
                title="Emitir Turings (issueToken)"
                buttonLabel="Emitir"
                codinomes={alunos}
                disabled={!!txBeingSent}
                onSubmit={(c, amount) =>
                  sendTx(`Turings emitidos para ${c}.`, () => contract.issueToken(c, amount))
                }
              />
              <div className="card mb-4">
                <div className="card-body">
                  <h4>Controle da votação</h4>
                  <button
                    className="btn btn-success mr-2"
                    disabled={!!txBeingSent || voting}
                    onClick={() => sendTx("Votação ativada.", () => contract.votingOn())}
                  >
                    votingOn
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={!!txBeingSent || !voting}
                    onClick={() => sendTx("Votação pausada.", () => contract.votingOff())}
                  >
                    votingOff
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="col-md-6">
          <Ranking ranking={ranking} currentAddress={address} />
        </div>
      </div>
    </div>
  );
}
