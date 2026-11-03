import React, { useState } from "react";
import { ethers } from "ethers";

// Formulário genérico: seleciona um codinome e informa uma quantidade de Turings.
// Usado tanto para vote() quanto para issueToken().
export function TuringForm({ title, buttonLabel, codinomes, maxAmount, disabled, onSubmit }) {
  const [codinome, setCodinome] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState();

  function handleSubmit(event) {
    event.preventDefault();
    setError(undefined);
    let value;
    try {
      value = ethers.utils.parseUnits(amount, 18); // Turings -> unidades (18 casas)
    } catch {
      setError("Quantidade inválida");
      return;
    }
    onSubmit(codinome, value);
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h4>{title}</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Codinome</label>
            <select
              className="form-control"
              value={codinome}
              onChange={(e) => setCodinome(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione...
              </option>
              {codinomes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade de Turings{maxAmount && ` (máx. ${maxAmount})`}</label>
            <input
              className="form-control"
              type="number"
              step="any"
              min="0"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-danger mb-2">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={disabled}>
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
