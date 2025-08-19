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

mintBtn.addEventListener("click", async () => {
  if (!contract) {
    statusEl.textContent = "Please connect wallet first";
    return;
  }

  try {
    const recruiterAddr = recruiterSelect.value;
    console.log("Recruiter address selected:", recruiterAddr); // 🪵 Debug

    if (!recruiterAddr.startsWith("0x")) {
      throw new Error("Recruiter address is invalid: " + recruiterAddr);
    }

    const tx = await contract.mintCV(
      recruiterAddr,
      window.__DAPP_CONFIG__.TOKEN_URI
    );

    statusEl.textContent = `Minting... ${tx.hash}`;
    await tx.wait();
    statusEl.textContent = "✅ Minted successfully!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = `❌ Error: ${err.message}`;
  }
});
});
