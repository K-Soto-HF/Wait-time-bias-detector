/*

Wait Time Bias Detector – Human Factors Chrome Extension
Author: Karina Sotolongo
Focus: Human Factors | UX | Decision Support
Powered by Queue-Times.com

ALL LOGIC IS INTENTIONALLY CONTAINED IN THIS FILE:
- Cognitive bias detection
- Sentiment analysis
- Time perception model
- Live operational data fetch
- On-page decision-support UI
- Bias highlighting



// CONFIGURATION
const PARK_ID = 64; // Universal Studios Florida
const QUEUE_TIMES_API = `https://queue-times.com/parks/${PARK_ID}/queue_times.json`;

// HUMAN FACTORS MODELS
const BIAS_PHRASES = [
  "felt like forever",
  "took forever",
  "brutal wait",
  "not worth it",
  "way longer than expected",
  "endless",
  "never ending",
  "miserable",
  "frustrating"
];

const NEGATIVE_WORDS = [
  "bad", "terrible", "awful", "frustrating",
  "miserable", "annoying", "exhausting", "brutal"
];


// ANALYSIS FUNCTIONS
function sentimentScore(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return words.filter(word => NEGATIVE_WORDS.includes(word)).length * -1;
}

function countBiasPhrases(text) {
  text = text.toLowerCase();
  return BIAS_PHRASES.filter(phrase => text.includes(phrase)).length;
}

function estimatePerceivedWait(actualWait, sentiment, biasHits) {
  let inflation = 1.0;
  inflation += Math.abs(sentiment) * 0.15;
  inflation += biasHits * 0.10;
  return Math.round(actualWait * inflation);
}

// LIVE DATA FETCH
async function fetchQueueTimes() {
  try {
    const response = await fetch(QUEUE_TIMES_API);
    const data = await response.json();
    const waits = {};

    data.lands.forEach(land => {
      land.rides.forEach(ride => {
        if (ride.wait_time !== null) {
          waits[ride.name] = ride.wait_time;
        }
      });
    });

    return waits;
  } catch (error) {
    console.warn("Queue-Times fetch failed.");
    return {};
  }
}

// UI OVERLAY (DECISION SUPPORT)
function createOverlay({ actual, perceived, sentiment, biasHits }) {
  const panel = document.createElement("div");
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    background: #121212;
    color: #ffffff;
    padding: 14px;
    border-radius: 10px;
    font-size: 13px;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;

  panel.innerHTML = `
    <strong> Wait Time Bias Detected</strong><br><br>
    <b>Actual Wait:</b> ${actual} min<br>
    <b>Perceived Wait:</b> ${perceived} min<br><br>
    <b>Bias Indicators:</b> ${biasHits}<br>
    <b>Negative Affect:</b> ${sentiment}<br><br>
    <em>Perceived delay inflated due to emotional language and expectation mismatch.</em>
    <hr>
    <small>Powered by Queue-Times.com</small>
  `;

  document.body.appendChild(panel);
  setTimeout(() => panel.remove(), 15000);
}


// HIGHLIGHT BIASED LANGUAGE
function highlightBiasLanguage() {
  let html = document.body.innerHTML;

  BIAS_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase, "gi");
    html = html.replace(
      regex,
      `<span style="background:#ffcccc;padding:2px;border-radius:3px">${phrase}</span>`
    );
  });

  document.body.innerHTML = html;
}


// MAIN EXECUTION
(async function runDetector() {
  const pageText = document.body.innerText || "";

  const sentiment = sentimentScore(pageText);
  const biasHits = countBiasPhrases(pageText);

  if (biasHits === 0 && sentiment === 0) return;

  const waits = await fetchQueueTimes();
  const firstRide = Object.keys(waits)[0];
  const actualWait = waits[firstRide] || 30;

  const perceivedWait = estimatePerceivedWait(
    actualWait,
    sentiment,
    biasHits
  );

  highlightBiasLanguage();
  createOverlay({
    actual: actualWait,
    perceived: perceivedWait,
    sentiment,
    biasHits
  });
})();
