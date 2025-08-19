// public/js/view.js
(async function () {
  const cfg = window.__DAPP_CONFIG__;
  const status = document.getElementById("status");
  const tokenIdInput = document.getElementById("tokenIdInput");
  const loadBtn = document.getElementById("loadBtn");
  const resultDiv = document.getElementById("result");

  // Load ABI
  let abi = await (await fetch("/abi/Cvnft.json")).json();

  let provider, contract;

  async function init() {
    if (!window.ethereum) {
      status.textContent = "MetaMask not found";
      return;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    contract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, provider);
  }

  loadBtn?.addEventListener("click", async () => {
    try {
      await init();
      const tokenId = tokenIdInput.value.trim();
      if (!tokenId) {
        status.textContent = "Enter a token ID";
        return;
      }

      status.textContent = "Loading token data…";

      // --- Read recruiter address from contract ---
      const recruiter = await contract.recruiters(tokenId);

      // --- Read tokenURI & resolve metadata ---
      const tokenUri = await contract.tokenURI(tokenId);
      let metadata = {};
      try {
        // Swap ipfs:// with a gateway
        const url = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
        metadata = await (await fetch(url)).json();
      } catch (e) {
        console.warn("Metadata fetch failed:", e);
      }

      // --- Display info ---
      resultDiv.innerHTML = `
        <p><strong>Token ID:</strong> ${tokenId}</p>
        <p><strong>Recruiter:</strong> ${recruiter}</p>
        <p><strong>Token URI:</strong> ${tokenUri}</p>
        <p><strong>Name:</strong> ${metadata.name || "(none)"}</p>
        <p><strong>Description:</strong> ${metadata.description || "(none)"}</p>
        ${
          metadata.image
            ? `<img src="${metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}" 
                   alt="CV Preview" style="max-width:300px;"/>`
            : ""
        }
      `;

      status.textContent = "Loaded successfully.";
    } catch (e) {
      status.textContent = `Load failed: ${e.message || e}`;
    }
  });
})();
