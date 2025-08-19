(async function () {
  const cfg = window.__DAPP_CONFIG__;
  const tokenInput = document.getElementById("tokenInput");
  const loadBtn = document.getElementById("loadBtn");
  const ownerEl = document.getElementById("owner");
  const recruiterEl = document.getElementById("recruiter");
  const bpsEl = document.getElementById("bps");
  const openMeta = document.getElementById("openMeta");
  const openPDF = document.getElementById("openPDF");
  const status = document.getElementById("status");
  const pdfEmbed = document.getElementById("pdfEmbed");
  const pdfFrame = document.getElementById("pdfFrame");
  const shareLink = document.getElementById("shareLink");
  const emailLink = document.getElementById("emailLink");

  const abi = await (await fetch("/abi/Cvnft.json")).json();

  // Read-only public RPC (no wallet needed)
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");
  const contract = new ethers.Contract(cfg.CONTRACT_ADDRESS, abi, provider);

  const ipfsToHttp = (uri) =>
    uri?.startsWith("ipfs://") ? uri.replace("ipfs://", "https://ipfs.io/ipfs/") : uri;

  async function load() {
    try {
      status.textContent = "Loading…";
      const tokenId = Number(tokenInput.value);
      if (!tokenId) throw new Error("Enter a tokenId");

      const [owner, cv, uri] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.getCV(tokenId),   // returns { recruiter, commissionBps, paid }
        contract.tokenURI(tokenId)
      ]);

      ownerEl.textContent = owner;
      recruiterEl.textContent = cv.recruiter;
      bpsEl.textContent = cv.commissionBps.toString();

      // metadata + pdf
      const metaURL = ipfsToHttp(uri);
      openMeta.href = metaURL;
      const meta = await (await fetch(metaURL)).json().catch(() => null);
      if (meta?.animation_url) {
        const pdfURL = ipfsToHttp(meta.animation_url);
        openPDF.href = pdfURL;
        pdfFrame.src = pdfURL;
        pdfEmbed.classList.remove("hidden");
      } else {
        openPDF.removeAttribute("href");
        pdfEmbed.classList.add("hidden");
      }

      // share helpers
      const share = `${location.origin}/view/${tokenId}`;
      shareLink.href = share;
      shareLink.onclick = (e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(share);
        status.textContent = "Share link copied to clipboard.";
      };
      emailLink.href =
        `mailto:?subject=Sarah%20Woods%20CV%20NFT%20%28token%20${tokenId}%29` +
        `&body=View%20this%20CV%20token:%20${encodeURIComponent(share)}`;

      status.textContent = "Loaded.";
    } catch (e) {
      status.textContent = e.message || String(e);
    }
  }

  loadBtn.onclick = load;
  if (tokenInput.value) load();
})();
