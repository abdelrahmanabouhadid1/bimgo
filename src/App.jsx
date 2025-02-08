// src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";

const terms = [
  { term: "LOD 100-500", clue: "Defines the level of detail in a model." },
  { term: "IFC", clue: "Open file format for model exchange." },
  {
    term: "Common Data Environment",
    clue: "A shared digital workspace for teams.",
  },
  { term: "Clash Detection", clue: "Identifying design conflicts in a model." },
  { term: "COBie", clue: "Standard for asset data exchange." },
  { term: "Revit", clue: "Popular BIM software by Autodesk." },
  {
    term: "Navisworks",
    clue: "Software for model coordination and clash detection.",
  },
  { term: "Dynamo", clue: "Visual scripting tool for BIM automation." },
  {
    term: "Model Federation",
    clue: "Combining multiple models into a single environment.",
  },
  { term: "EIR", clue: "Defines employer's information requirements." },
  { term: "BEP", clue: "Document outlining BIM use on a project." },
  { term: "ISO 19650", clue: "International BIM standard." },
  { term: "4D BIM", clue: "Adds time scheduling to BIM models." },
  { term: "5D BIM", clue: "Integrates cost estimation with BIM models." },
];

// Firebase imports using the modular SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, push, onValue } from "firebase/database";

// React Share imports
import {
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  LinkedinIcon,
  WhatsappIcon,
} from "react-share";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiuXOinmC0E95-l90oTNPPcAekJaNt1zQ",
  authDomain: "bimingo-f5f11.firebaseapp.com",
  databaseURL: "https://bimingo-f5f11-default-rtdb.firebaseio.com",
  projectId: "bimingo-f5f11",
  storageBucket: "bimingo-f5f11.firebasestorage.app",
  messagingSenderId: "535162543938",
  appId: "1:535162543938:web:8ba68d94e74c85442d72db",
  measurementId: "G-CHR1291S6Z",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const database = getDatabase(app);

function App() {
  // Game states
  const [playerName, setPlayerName] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [shuffledTerms, setShuffledTerms] = useState([]);
  const [currentClue, setCurrentClue] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [message, setMessage] = useState("");
  const [hasGameStarted, setHasGameStarted] = useState(false); // Track if game has started

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScoreKey, setMyScoreKey] = useState(null);

  // Load stored values on mount
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    const storedLinkedin = localStorage.getItem("linkedinProfile");
    if (storedName) setPlayerName(storedName);
    if (storedLinkedin) setLinkedinProfile(storedLinkedin);
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Leaderboard from Firebase
  useEffect(() => {
    const leaderboardRef = ref(database, "leaderboard/");
    onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        entries.sort((a, b) => a.time - b.time);
        setLeaderboard(entries);
      }
    });
  }, []);

  // Start Game
  const startGame = () => {
    if (playerName.trim() === "") {
      alert("Player Name is required");
      return;
    }
    setHasGameStarted(true);
    setMessage("");
    setMyScoreKey(null);
    const shuffled = [...terms].sort(() => Math.random() - 0.5).slice(0, 16);
    setShuffledTerms(
      shuffled.map((termObj) => ({ ...termObj, answered: false, wrong: false }))
    );
    pickNewClue(shuffled);
    setTimeElapsed(0);
    setTimerActive(true);
  };

  const pickNewClue = (termsList = shuffledTerms) => {
    if (termsList.length > 0) {
      const randomItem =
        termsList[Math.floor(Math.random() * termsList.length)];
      setCurrentClue(randomItem);
    }
  };

  const handleTileClick = (tile) => {
    if (tile.answered) return;
    if (tile.term === currentClue.term) {
      const updatedTiles = shuffledTerms.map((t) =>
        t.term === tile.term ? { ...t, answered: true } : t
      );
      setShuffledTerms(updatedTiles);
      const remaining = updatedTiles.filter((t) => !t.answered);
      if (remaining.length === 0) {
        const nameToShow = playerName || "Anonymous";
        setMessage(
          `🎉 ${nameToShow} completed BIM Bingo in ${timeElapsed} seconds!`
        );
        setTimerActive(false);
        saveToFirebase(nameToShow, linkedinProfile, timeElapsed);
        setCurrentClue(null);
      } else {
        pickNewClue(remaining);
      }
    } else {
      const updatedTiles = shuffledTerms.map((t) =>
        t.term === tile.term ? { ...t, wrong: true } : t
      );
      setShuffledTerms(updatedTiles);
      setTimeout(() => {
        setShuffledTerms((prev) =>
          prev.map((t) => (t.term === tile.term ? { ...t, wrong: false } : t))
        );
      }, 700);
    }
  };

  const saveToFirebase = (name, linkedin, time) => {
    const leaderboardRef = ref(database, "leaderboard/");
    push(leaderboardRef, { name, time, linkedin })
      .then((res) => setMyScoreKey(res.key))
      .catch((error) => console.error("Error saving data to Firebase:", error));
  };

  // Share details
  const shareUrl = window.location.origin + window.location.pathname;
  const motivationalMessage =
    "Check out this BIM game, coded entirely by AI! Think you can beat me in BIM knowledge? Give it a shot!";
  const scoreMessage = `${playerName} completed the BIM Bingo Game in ${timeElapsed} seconds! Can you beat my time? Let's see who's the real BIM master!`;

  const getShareMessage = () => {
    if (hasGameStarted && !timerActive) {
      // Game finished, show the score
      return `${playerName} completed the BIM Bingo Game in ${timeElapsed} seconds! Can you beat my time? Let's see who's the real BIM master!`;
    } else {
      // Before game starts, show motivational message
      return "Check out this BIM game, coded entirely by AI! Think you can beat me in BIM knowledge? Give it a shot!";
    }
  };
  return (
    <div className="app-container">
      <header>
        <h1>🎯 BIM Bingo Game 🎯</h1>
        <p>Click the correct answer on the Bingo card based on the question!</p>
      </header>

      <div className="controls">
        <label>
          Player Name <span className="required">*</span>:
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              localStorage.setItem("playerName", e.target.value);
            }}
          />
        </label>
        <label>
          LinkedIn Profile (optional):
          <input
            type="text"
            value={linkedinProfile}
            onChange={(e) => {
              setLinkedinProfile(e.target.value);
              localStorage.setItem("linkedinProfile", e.target.value);
            }}
          />
        </label>
        <button onClick={startGame}>Start Game</button>
      </div>

      <div className="clue">
        <p>{currentClue ? currentClue.clue : 'Click "Start Game" to begin!'}</p>
      </div>

      <div className="grid-container">
        {shuffledTerms.map((tile) => (
          <div
            key={tile.term}
            className={`grid-item ${tile.answered ? "answered" : ""} ${
              tile.wrong ? "wrong" : ""
            }`}
            onClick={() => handleTileClick(tile)}
          >
            <span>{tile.term}</span>
          </div>
        ))}
      </div>

      <div className="timer">
        <p>Time: {timeElapsed} seconds</p>
      </div>

      {message && (
        <div className="message">
          <p>{message}</p>
        </div>
      )}

      {/* React Share Buttons with Updated Messages */}
      <div className="social">
        <FacebookShareButton
          url={shareUrl}
          quote={getShareMessage()} // Facebook uses 'quote' for the message
          className="share-button"
        >
          <FacebookIcon size={40} round />
        </FacebookShareButton>

        <LinkedinShareButton
          url={shareUrl}
          title="BIM Bingo Game"
          summary={getShareMessage()} // LinkedIn uses 'summary' for the message
          source="BIM Bingo"
          className="share-button"
        >
          <LinkedinIcon size={40} round />
        </LinkedinShareButton>

        <WhatsappShareButton
          url={shareUrl}
          title={getShareMessage()} // WhatsApp uses 'title' for the message
          separator=" - "
          className="share-button"
        >
          <WhatsappIcon size={40} round />
        </WhatsappShareButton>
      </div>

      <div className="leaderboard">
        <h2>🏆 Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Time (seconds)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.id}
                className={entry.id === myScoreKey ? "highlight" : ""}
              >
                <td>{index + 1}</td>
                <td>{entry.name}</td>
                <td>{entry.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="donate">
        <a
          href="https://www.paypal.com/donate?hosted_button_id=YOUR_BUTTON_ID"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Buy Me a Coffee
        </a>
      </div>
    </div>
  );
}

export default App;
