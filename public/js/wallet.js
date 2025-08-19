(async function () {
  const cfg = window.__DAPP_CONFIG__;
  const accountSpan = document.getElementById("accountSpan");
  const connectBtn = document.getElementById("connectBtn");
  const CONTRACT_ADDRESS = "0xe9b693fc44b23764cef43716eaf2f1b9e88d1bf0";
  const TOKEN_URI = "ipfs://Qm.....";  // your pinned CV metadata URI

contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);


  // Load ABI (you'll paste the ABI JSON into /abi/Cvnft.json)
  let abi = await (await fetch("/abi/Cvnft.json")).json();

  // Network map (Sepolia + Base Sepolia kept for flexibility)
  const NETWORKS = {
    11155111: {
      chainIdHex: "0xaa36a7",
      chainName: "Sepolia",
      rpcUrls: ["https://rpc.sepolia.org"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    },
    84532: {
      chainIdHex: "0x14a34",
      chainName: "Base Sepolia",
      rpcUrls: ["https://sepolia.base.org"],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    },
  };

  async function ensureCorrectNetwork() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const desired = Number(cfg.CHAIN_ID_DEC);
    const net = NETWORKS[desired];
    const current = (await ethereum.request({ method: "eth_chainId" })).toLowerCase();
    if (current !== net.chainIdHex.toLowerCase()) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: net.chainIdHex,
          chainName: net.chainName,
          nativeCurrency: net.nativeCurrency,
          rpcUrls: net.rpcUrls,
          blockExplorerUrls: net.blockExplorerUrls,
        }],
      });
    }
  }

  let provider, signer, contract;

  async function connect() {
    await ensureCorrectNetwork();
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const addr = await signer.getAddress();
    accountSpan.textContent = `Connected: ${addr.slice(0,6)}…${addr.slice(-4)}`;
    contract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, signer);
  }

  connectBtn.onclick = connect;

  // Mint
  document.getElementById("mintForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const recruiter = document.getElementById("recruiter").value.trim();
    const bps = Number(document.getElementById("bps").value);
    const tokenURI = document.getElementById("tokenURI").value.trim();
    const status = document.getElementById("mintStatus");
    try {
      if (!contract) await connect();
      status.textContent = "Submitting mint…";
      const tx = await contract.mintCV(recruiter, tokenURI);
      const rc = await tx.wait();
      const ev = rc.events.find(e => e.event === "CVMinted");
      const tokenId = ev?.args?.tokenId?.toString?.() || "check tx";
      status.textContent = `Minted! Token ID: ${tokenId}`;
    } catch (err) {
      status.textContent = `Mint failed: ${err.message || err}`;
    }
  });

  // Set employer
  document.getElementById("employerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tokenId = Number(document.getElementById("empTokenId").value);
    const employer = document.getElementById("employer").value.trim();
    const status = document.getElementById("employerStatus");
    try {
      if (!contract) await connect();
      status.textContent = "Submitting setEmployer…";
      const tx = await contract.setEmployer(tokenId, employer);
      await tx.wait();
      status.textContent = `Employer set for Token ${tokenId}`;
    } catch (err) {
      status.textContent = `setEmployer failed: ${err.message || err}`;
    }
  });

  // Employer pays
  document.getElementById("payForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tokenId = Number(document.getElementById("payTokenId").value);
    const amtEth = document.getElementById("payAmount").value.trim();
    const status = document.getElementById("payStatus");
    try {
      if (!contract) await connect();
      const value = ethers.utils.parseEther(amtEth);
      status.textContent = "Submitting payHire…";
      const tx = await contract.payHire(tokenId, { value });
      await tx.wait();
      status.textContent = `Paid & split for Token ${tokenId}`;
    } catch (err) {
      status.textContent = `payHire failed: ${err.message || err}`;
    }
  });

  if (window.ethereum) {
    ethereum.on("accountsChanged", () => location.reload());
    ethereum.on("chainChanged", () => location.reload());
  }
})();
