window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const accountSpan = document.getElementById("accountSpan");
  const status = document.getElementById("status");

  let provider;
  let signer;

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      status.textContent = "MetaMask not found.";
      return;
    }

    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      const account = await signer.getAddress();

      accountSpan.textContent = `Connected: ${account}`;
      status.textContent = "Wallet connected!";
      console.log("Wallet connected:", account);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      status.textContent = "Connection failed.";
    }
  }

  connectBtn.addEventListener("click", connectWallet);
});
