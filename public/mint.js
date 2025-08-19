// public/js/mint.js
(async function () {
  const cfg = window.__DAPP_CONFIG__;

  // Grab elements once
  const status = document.getElementById("status");
  const accountSpan = document.getElementById("accountSpan");
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");

  // ---- Secure-context guard (HTTPS or localhost) ----
  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    if (status) status.textContent =
      "Wallet connect requires HTTPS (or localhost). Open the Cloud9 preview URL or an HTTPS domain.";
    if (connectBtn) connectBtn.disabled = true;
    if (mintBtn) mintBtn.disabled = true;
    return;
  }

  // ---- Load ABI once ----
  let abi = await (await fetch("/abi/Cvnft.json")).json();

  // ---- Networks (Sepolia) ----
  const NETWORKS = {
    11155111: {
      chainIdHex: "0xaa36a7",
      chainName: "Sepolia",
      rpcUrls: ["https://rpc.sepolia.org"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    },
  };

  let provider, signer, contract;

  async function ensureNetwork() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const wantedDec = Number(cfg.CHAIN_ID_DEC || cfg.CONTRACT_CHAIN_ID || 11155111);
    const net = NETWORKS[wantedDec];
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

  async function connect() {
    await ensureNetwork();
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const addr = await signer.getAddress();
    if (accountSpan) accountSpan.textContent = `Connected: ${addr.slice(0,6)}…${addr.slice(-4)}`;
    contract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, signer);
  }

  connectBtn?.addEventListener("click", async () => {
    try { await connect(); status.textContent = "Wallet connected."; }
    catch (e) { status.textContent = e.message || String(e); }
  });

  // ---- Recruiter mapping (dropdown -> wallet address) ----
  const RECRUITER_MAP = {
    "DreamJob": cfg.DEFAULT_RECRUITER, // comes from your env.config
  };

  mintBtn?.addEventListener("click", async () => {
  try {
    if (!contract) await connect();

    // Recruiter comes from dropdown
    const recruiterName = document.getElementById("recruiterInput")?.value || "DreamJob";
    const recruiterAddr = RECRUITER_MAP[recruiterName];

    // Hardcode commission (10%)
    const commissionBps = 1000;

    // Token URI from env config
    const tokenUri = cfg.TOKEN_URI;

    status.textContent = "Submitting mint…";
    const tx = await contract.mintCV(recruiterAddr, commissionBps, tokenUri);
    const rc = await tx.wait();

    const ev = rc.events?.find(e => e.event === "CVMinted");
    const tokenId = ev?.args?.tokenId?.toString?.() ?? "check tx";

    const share = `${location.origin}/view/${tokenId}`;
    status.innerHTML = `Minted! Token ID: ${tokenId} — <a href="${share}" target="_blank" rel="noopener">Open recruiter view</a>`;
  } catch (e) {
    status.textContent = `Mint failed: ${e.message || String(e)}`;
  }
});


  if (window.ethereum) {
    ethereum.on("accountsChanged", () => location.reload());
    ethereum.on("chainChanged", () => location.reload());
  }
})();
