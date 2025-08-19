// app.js
require("dotenv").config();
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static
app.use(express.static(path.join(__dirname, "public")));
app.use("/abi", express.static(path.join(__dirname, "abi")));

// make env vars available to all templates
app.use((req, res, next) => {
  res.locals.CONTRACT_ADDRESS   = process.env.CONTRACT_ADDRESS || "";
  res.locals.CONTRACT_CHAIN_ID  = process.env.CONTRACT_CHAIN_ID || "11155111";
  res.locals.DEFAULT_RECRUITER  = process.env.DEFAULT_RECRUITER || "";
  res.locals.DEFAULT_BPS        = process.env.DEFAULT_BPS || "1000";
  res.locals.TOKEN_URI          = process.env.TOKEN_URI || "";
  res.locals.LINKEDIN_URL       = process.env.LINKEDIN_URL || "#";
  next();
});

// routes
app.get("/", (_req, res) => res.render("pages/index"));
app.get("/mint", (_req, res) => res.render("pages/mint"));
app.get("/view/:id?", (req, res) => res.render("pages/view", { tokenId: req.params.id || "" }));
app.get("/health", (_req, res) => res.send("ok"));

app.get("/view", (_req, res) => res.render("pages/view", { tokenId: "" }));
app.get("/view/:id", (req, res) => res.render("pages/view", { tokenId: req.params.id }));


// start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`CV NFT dApp listening on port ${PORT}`);
});
