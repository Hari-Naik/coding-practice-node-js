const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
  }
};

initializeDbAndServer();

const convertDbObjToResponseObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

//API 1

app.get("/players/", async (req, res) => {
  const getAllPlayers = `SELECT * FROM player_details;`;
  const playersArr = await db.all(getAllPlayers);

  res.send(
    playersArr.map((eachplayer) => convertDbObjToResponseObj(eachplayer))
  );
});

// API 2

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayers = `SELECT * FROM player_details
  WHERE player_id = ${playerId};`;
  const playerArr = await db.get(getPlayers);

  res.send(convertDbObjToResponseObj(playerArr));
});

//API 3

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;

  const updateQuery = `UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  await db.run(updateQuery);

  res.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;

  const getMatchesQuery = `SELECT match_id as matchId, match,year FROM match_details
    WHERE match_id = ${matchId};`;

  const matchesArr = await db.get(getMatchesQuery);

  res.send(matchesArr);
});

//API 5

app.get("/players/:playerId/matches/", async (req, res) => {
  const { playerId } = req.params;

  const getAllMatchesOfPlayer = `SELECT match_details.match_id as matchId, match, year
    FROM match_details INNER JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;

  const allMatchesArr = await db.all(getAllMatchesOfPlayer);

  res.send(allMatchesArr);
});

//API 6

app.get("/matches/:matchId/players/", async (req, res) => {
  const { matchId } = req.params;

  const getAllPlayersQuery = `SELECT player_details.player_id as playerId,player_name as playerName
    FROM player_details INNER JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};`;

  const allPlayersArr = await db.all(getAllPlayersQuery);
  res.send(allPlayersArr);
});

// API 7

app.get("/players/:playerId/playerScores/", async (req, res) => {
  const { playerId } = req.params;

  const getStatsOfPlayer = `SELECT 
                    player_details.player_id AS playerId,
                    player_name AS playerName,
                   SUM(score) AS  totalScore, 
                   SUM(fours) AS totalFours, 
                   SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;

  const scoreDetails = await db.get(getStatsOfPlayer);
  res.send(scoreDetails);
});

module.exports = app;
