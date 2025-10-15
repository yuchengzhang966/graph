import 'dotenv/config';
import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import { ethers } from "ethers";

// ==== CONFIG ===
const inputFile = "./output.csv";
const outputFile = "./output.csv";

const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_API}`);

// === Helper to fetch symbol ===
async function getTokenSymbol(address) {
  if (!address || !address.startsWith("0x")) return "INVALID";
  try {
    await delay (1500)
    const abi = ["function symbol() view returns (string)"];
    const contract = new ethers.Contract(address, abi, provider);
    const symbol = await contract.symbol();
    console.log(`✅ ${address} → ${symbol}`);
    
    return symbol;
  } catch (err) {
    console.warn(`⚠️  ${address}: ${err.message}`);
    return "UNKNOWN";
  }
}

// === Read CSV ===
async function readCSV(path) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        console.log(`📄 Loaded ${results.length} rows from ${path}`);
        resolve(results);
      })
      .on("error", reject);
  });
}

// === Write CSV ===
async function writeCSV(data, path) {
  if (data.length === 0) {
    console.log("No data to write.");
    return;
  }
  const headers = Object.keys(data[0]).map((key) => ({ id: key, title: key }));
  const writer = createObjectCsvWriter({ path, header: headers });
  await writer.writeRecords(data);
  console.log(`💾 Saved ${data.length} rows to ${path}`);
}

// === Main ===
async function main() {
  const rows = await readCSV(inputFile);
  const processed = [];

  for (const row of rows) {
    const address = (row.asset || "").trim();
    const symbol = await getTokenSymbol(address);
    processed.push({ ...row, symbol });
    
  }

  await writeCSV(processed, outputFile);
  console.log("✅ Done!");
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
main().catch(console.error);

// getTokenSymbol("0x6b175474e89094c44da98b954eedeac495271d0f").then(console.log);