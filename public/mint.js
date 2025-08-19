// public/js/mint.js
(async function () {
  console.log("✅ mint.js loaded");

  const cfg = window.__DAPP_CONFIG__;
  const status = document.getElementById("status");
  const accountSpan = document.getElementById("accountSpan");
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");

  let provider, signer, contract, abi;

  // Load ABI immediately
  try {
    abi = await (await fetch("/abi/Cvnft.json")).json();
  } catch (err) {
    console.error("ABI load failed", err);
    if (status) status.textContent = "Failed to load contract ABI.";
    return;
  }

  // Connect wallet
  async function connect() {
    if (!window.ethereum) {
      status.textContent = "MetaMask not found!";
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();

      const addr = await signer.getAddress();
      accountSpan.textContent = `Connected: ${addr.slice(0, 6)}…${addr.slice(-4)}`;
      contract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, signer);

      status.textContent = "Wallet connected.";
    } catch (err) {
      console.error("Wallet connect failed", err);
      status.textContent = "Wallet connection failed.";
    }
  }

  connectBtn?.addEventListener("click", connect);

  // Mint
  mintBtn?.addEventListener("click", async () => {
    try {
      if (!contract) await connect();

      const recruiterName = document.getElementById("recruiterInput")?.value || "DreamJob";
      const recruiterAddr = cfg.DEFAULT_RECRUITER;
      const tokenUri = cfg.TOKEN_URI;

      status.textContent = "Submitting mint…";
      const tx = await contract.mintCV(recruiterAddr, tokenUri);
      const rc = await tx.wait();

      const ev = rc.events?.find(e => e.event === "CVMinted");
      const tokenId = ev?.args?.tokenId?.toString?.() ?? "check tx";

      const share = `${location.origin}/view/${tokenId}`;
      status.innerHTML = `Minted! Token ID: ${tokenId} — <a href="${share}" target="_blank">View</a>`;
    } catch (err) {
      console.error("Mint failed", err);
      status.textContent = `Mint failed: ${err.message || err}`;
    }
  });

  // Reload on account/network change
  if (window.ethereum) {
    ethereum.on("accountsChanged", () => location.reload());
    ethereum.on("chainChanged", () => location.reload());
  }
})();
