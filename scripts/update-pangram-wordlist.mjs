import https from "node:https";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://raw.githubusercontent.com/ConorSheehan1/spelling-bee/main/data/AllWords.txt";
const MIN_LENGTH = 4;
const OUTPUT_PATH = "src/games/pangram/wordlist.json";

function fetchWordlist(url = SOURCE_URL) {
  return new Promise((resolveFetch, rejectFetch) => {
    https
      .get(
        url,
        {
          family: 4,
          headers: {
            "User-Agent": "MyGames-wordlist-updater",
            Accept: "text/plain"
          }
        },
        (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            fetchWordlist(response.headers.location).then(resolveFetch).catch(rejectFetch);
            return;
          }

          if (response.statusCode !== 200) {
            rejectFetch(new Error(`Failed to fetch word list: ${response.statusCode} ${response.statusMessage}`));
            return;
          }

          response.setEncoding("utf8");
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => resolveFetch(data));
        }
      )
      .on("error", (error) => {
        rejectFetch(error);
      });
  });
}

function normaliseWord(word) {
  const trimmed = word.trim();
  if (trimmed.length < MIN_LENGTH) return null;
  if (!/^[a-z]+$/i.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

function buildWordSet(rawText) {
  const words = rawText.split(/\r?\n/);
  const unique = new Set();
  for (const word of words) {
    const normalised = normaliseWord(word);
    if (normalised) {
      unique.add(normalised);
    }
  }
  return Array.from(unique).sort();
}

async function writeWordlist(words) {
  const resolvedPath = resolve(dirname(fileURLToPath(import.meta.url)), "../", OUTPUT_PATH);
  const json = `${JSON.stringify(words, null, 2)}\n`;
  await writeFile(resolvedPath, json, "utf8");
}

async function main() {
  const raw = await fetchWordlist();
  const words = buildWordSet(raw);
  await writeWordlist(words);
  console.log(`Updated ${OUTPUT_PATH} with ${words.length} entries from the open-source Spelling Bee project.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
