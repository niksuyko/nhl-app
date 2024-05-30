const teamAbbreviations = require('../teamAbbreviations.json');
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');
const app = express();
const port = 3001;

// middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// root endpoint
app.get('/', (req, res) => {
    res.send('NHL Team Data API');
});

// cache configuration
const cache = new NodeCache({ stdTTL: 300 }); // cache 5 minutes

// endpoint to fetch teams
app.get('/api/teams', async (req, res) => {
    console.log('Fetching teams data');
    try {
        const cachedData = cache.get('teams');
        if (cachedData) {
            return res.json(cachedData);
        }

        const response = await axios.get('https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=20232024');
        const teamsData = response.data.data;

        if (!teamsData || !Array.isArray(teamsData)) {
            throw new Error('Unexpected response format');
        }

        console.log('Fetched teams data:', teamsData.length, 'records');

        const teams = await Promise.all(teamsData.map(async team => {
            const abbreviation = teamAbbreviations[team.teamFullName];
            let hasPlayoffGames = false;

            if (abbreviation) {
                try {
                    const additionalDataResponse = await axios.get(`https://api-web.nhle.com/v1/club-stats-season/${abbreviation}`);
                    const seasonData = additionalDataResponse.data.find(season => season.season === 20232024);
                    if (seasonData && seasonData.gameTypes.includes(3)) {
                        hasPlayoffGames = true;
                    }
                } catch (error) {
                    console.error(`Error fetching additional data for ${abbreviation}:`, error.response ? error.response.data : error.message);
                }
            } else {
                console.warn(`No abbreviation found for team: ${team.teamFullName}`);
            }

            return {
                id: team.teamId,
                name: team.teamFullName,
                points: team.wins,
                record: `${team.losses}-${team.otLosses || 0}`,
                progress: Math.round((team.wins / 82) * 100),
                hasPlayoffGames
            };
        }));

        console.log('Processed teams data:', teams.length, 'records');

        cache.set('teams', teams); // cache processed data
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams data:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching teams data' });
    }
});

// endpoint to fetch upcoming games for a team
app.get('/api/team/:abbr/upcoming-games', async (req, res) => {
    const { abbr } = req.params;
    try {
        const response = await axios.get('https://api-web.nhle.com/v1/schedule/now');
        const scheduleData = response.data.gameWeek.flatMap(week => week.games.map(game => ({
            dayAbbrev: week.dayAbbrev,
            homeTeam: game.homeTeam.abbrev,
            awayTeam: game.awayTeam.abbrev,
            venue: game.venue.default,
            startTimeUTC: game.startTimeUTC
        })))
            .filter(game => game.awayTeam === abbr || game.homeTeam === abbr);

        const latestGame = scheduleData.length > 0 ? scheduleData[0] : null;

        res.json(latestGame);
    } catch (error) {
        console.error('Error fetching upcoming games:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching upcoming games' });
    }
});

// endpoint to fetch player data for a team
app.get('/api/team/:abbr/players/:type', async (req, res) => {
    const { abbr, type } = req.params;

    try {
        // check if the abbrev exists
        if (!Object.values(teamAbbreviations).includes(abbr)) {
            console.warn(`Team abbreviation ${abbr} not found`);
            return res.status(404).json({ message: `Team abbreviation ${abbr} not found` });
        }

        if (type !== '2' && type !== '3') {
            console.warn(`Invalid type ${type}`);
            return res.status(400).json({ message: `Invalid type ${type}` });
        }

        const response = await axios.get(`https://api-web.nhle.com/v1/club-stats/${abbr}/20232024/${type}`);
        const playerData = response.data.skaters;
        const goalieData = response.data.goalies;

        if (!playerData || !Array.isArray(playerData) || !goalieData || !Array.isArray(goalieData)) {
            throw new Error('Unexpected response format');
        }

        console.log(`Fetched player and goalie data for ${abbr} (type ${type}):`, playerData.length, 'skater records', goalieData.length, 'goalie records');
        res.json({ skaters: playerData, goalies: goalieData });
    } catch (error) {
        console.error(`Error fetching player data for ${abbr} (type ${type}):`, error.response ? error.response.data : error.message);
        res.status(500).json({ message: `Error fetching player data for ${abbr} (type ${type})` });
    }
});

// start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
