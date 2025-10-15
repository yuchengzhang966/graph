// process_tokens.mjs
import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import { ethers } from "ethers";

// === CONFIG ===
const inputFile = "output.csv";
const outputFile = "output.csv";

// You can use a public RPC like Llama RPC or Infura:
const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

// Helper: get token symbol from contract
async function getTokenSymbol(address) {
  try {
    const abi = ["function symbol() view returns (string)"];
    const contract = new ethers.Contract(address, abi, provider);
    const symbol = await contract.symbol();
    return symbol;
  } catch (err) {
    console.error(`⚠️  Could not fetch symbol for ${address}: ${err.message}`);
    return "UNKNOWN";
  }
}

// Read the CSV file and process each row
async function processCSV() {
  const rows = [];
  for await (const row of readCSV(inputFile)) {
    const address = row.asset?.trim();
    const symbol = await getTokenSymbol(address);
    rows.push({ ...row, symbol });
  }

  // Write to new CSV
  await writeCSV(rows, outputFile);
  console.log(`✅ Done! Saved to ${outputFile}`);
}

// Read CSV as async generator
async function* readCSV(path) {
  const stream = fs.createReadStream(path).pipe(csv());
  for await (const row of stream) {
    yield row;
  }
}

// Write CSV file
async function writeCSV(data, path) {
  const headers = Object.keys(data[0]).map((key) => ({ id: key, title: key }));
  const writer = createObjectCsvWriter({ path, header: headers });
  await writer.writeRecords(data);
}

// Run the script
processCSV();
