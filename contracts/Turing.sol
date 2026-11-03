// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/**
 * Turing: token de votação dos projetos finais.
 *
 * Estratégia "Uncapped Lazy Supply": nenhum token é emitido no deploy;
 * Turings são criados sob demanda (issueToken e vote), sem limite máximo.
 *
 * Unidades: assim como o ETH, 1 Turing = 10^18 unidades (decimals = 18).
 * Todas as quantidades passadas às funções estão nessas unidades.
 */
contract Turing {
    string public name = "Turing";
    string public symbol = "TUR";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public owner;

    // Codinome => endereço do usuário autorizado
    mapping(string => address) public users;
    // Lista de codinomes cadastrados (permite iterar e fazer busca reversa)
    string[] public codinomes;
    mapping(string => bool) private isCodinome;

    mapping(address => uint256) public balanceOf;

    bool public voting = true;

    // votante => votado => já votou?
    mapping(string => mapping(string => bool)) public hasVote;
    // Quantidade de votos feitos por cada codinome
    mapping(string => uint256) public voteCount;

    string private constant PROFESSORA = "roberta";
    uint256 public constant MAX_VOTE = 2 * 10 ** decimals;
    uint256 public constant VOTE_REWARD = 1 * 10 ** decimals;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Voted(string voter, string candidate, uint256 amount);
    event TokenIssued(string codinome, uint256 amount);
    event VotingStatusChanged(bool voting);
    event UserUpdated(string codinome, address user);

    modifier onlySuperUser() {
        require(
            msg.sender == owner || msg.sender == users[PROFESSORA],
            "Apenas o owner ou a professora"
        );
        _;
    }

    constructor() {
        owner = msg.sender;

        _setUser("roberta", 0x502542668aF09fa7aea52174b9965A7799343Df7);
        _setUser("nome1", 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _setUser("nome2", 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _setUser("nome3", 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        _setUser("nome4", 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        _setUser("nome5", 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
    }

    function updateUser(string memory codinome, address user_addr) external onlySuperUser {
        require(bytes(codinome).length > 0, "Codinome vazio");
        _setUser(codinome, user_addr);
    }

    function votingOn() external onlySuperUser {
        voting = true;
        emit VotingStatusChanged(true);
    }

    function votingOff() external onlySuperUser {
        voting = false;
        emit VotingStatusChanged(false);
    }

    function issueToken(string memory codinome, uint256 amount) external onlySuperUser {
        address to = users[codinome];
        require(to != address(0), "Codinome nao cadastrado");
        _mint(to, amount);
        emit TokenIssued(codinome, amount);
    }

    function vote(string memory codinome, uint256 amount) external {
        require(voting, "Votacao pausada");

        string memory voter = codinomeOf(msg.sender);
        require(bytes(voter).length > 0, "Usuario nao autorizado");

        address candidate = users[codinome];
        require(candidate != address(0), "Codinome nao cadastrado");
        require(candidate != msg.sender, "Nao pode votar em si mesmo");
        require(amount > 0 && amount <= MAX_VOTE, "Quantidade deve ser > 0 e <= 2 Turings");
        require(!hasVote[voter][codinome], "Ja votou neste codinome");

        hasVote[voter][codinome] = true;
        _mint(candidate, amount);
        emit Voted(voter, codinome, amount);

        // A cada 10 votos, o votante recebe 1 Turing
        voteCount[voter] += 1;
        if (voteCount[voter] % 10 == 0) {
            _mint(msg.sender, VOTE_REWARD);
        }
    }

    /// Retorna o codinome associado a um endereço ("" se não for usuário).
    function codinomeOf(address addr) public view returns (string memory) {
        if (addr == address(0)) return "";
        for (uint256 i = 0; i < codinomes.length; i++) {
            if (users[codinomes[i]] == addr) return codinomes[i];
        }
        return "";
    }

    function getCodinomes() external view returns (string[] memory) {
        return codinomes;
    }

    function isSuperUser(address addr) external view returns (bool) {
        return addr == owner || addr == users[PROFESSORA];
    }

    function _setUser(string memory codinome, address user_addr) private {
        if (!isCodinome[codinome]) {
            isCodinome[codinome] = true;
            codinomes.push(codinome);
        }
        users[codinome] = user_addr;
        emit UserUpdated(codinome, user_addr);
    }

    function _mint(address to, uint256 amount) private {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
