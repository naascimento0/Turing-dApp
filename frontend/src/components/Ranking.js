import React from "react";
import { ethers } from "ethers";

export function Ranking({ ranking, currentAddress }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h4>Ranking</h4>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Codinome</th>
              <th className="text-right">Turings</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr
                key={r.codinome}
                className={
                  r.address.toLowerCase() === currentAddress.toLowerCase() ? "table-info" : ""
                }
              >
                <td>{i + 1}</td>
                <td>{r.codinome}</td>
                <td className="text-right">{ethers.utils.formatUnits(r.balance, 18)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
