console.log("mint.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const statusEl = document.getElementById("status");
  const accountEl = document.getElementById("accountSpan");
  const recruiterSelect = document.getElementById("recruiterSelect"); // dropdown

  let signer, contract;

  // connect wallet
  connectBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const account = await signer.getAddress();
    accountEl.textContent = `Connected: ${account}`;
    statusEl.textContent = "Wallet connected!";

    // load contract ABI
    const abi = await fetch("/abi/Cvnft.json").then(r => r.json()); 
    contract = new ethers.Contract(
      window.__DAPP_CONFIG__.CONTRACT_ADDRESS,
      abi,
      signer
    );
  });

  // mint CV NFT
  mintBtn.addEventListener("click", async () => {
    if (!contract) {
      statusEl.textContent = "Please connect wallet first";
      return;
    }

    try {
      const recruiter = recruiterSelect.value;  // address from dropdown
      const tokenUri = window.__DAPP_CONFIG__.TOKEN_URI; // backend-provided fixed URI

      console.log("Minting CV with recruiter:", recruiter, "URI:", tokenUri);

      const tx = await contract.mintCV(recruiter, tokenUri);
      statusEl.textContent = `⏳ Minting... ${tx.hash}`;
      const receipt = await tx.wait();
      statusEl.textContent = `✅ Minted! Token ID: ${receipt.events[0].args.tokenId.toString()}`;
    } catch (err) {
      console.error(err);
      statusEl.textContent = `❌ Error: ${err.message}`;
    }
  });
});
