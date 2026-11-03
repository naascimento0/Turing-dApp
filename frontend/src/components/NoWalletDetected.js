import React from "react";

export function NoWalletDetected() {
  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-6 p-4 text-center">
          <p>
            Nenhuma carteira Ethereum detectada. <br />
            Instale{" "}
            <a
              href="https://www.coinbase.com/wallet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Coinbase Wallet
            </a>
            ou{" "}
            <a href="http://metamask.io" target="_blank" rel="noopener noreferrer">
              MetaMask
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
