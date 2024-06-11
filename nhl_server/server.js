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

// cache configuration for team summary 
const cache = new NodeCache({ stdTTL: 300 }); // cache 5 minutes

// endpoint to fetch team summary data
app.get('/api/teams', async (req, res) => {
    console.log('Fetching teams data');
    try {
        // get cached data 
        const cachedData = cache.get('teams');
        // if its cached, return that data
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // otherwise, initiate new API get request to get team summary data
        const response = await axios.get('https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=20232024');
        const teamsData = response.data.data;

        // if no team data or not in array format, throw error
        if (!teamsData || !Array.isArray(teamsData)) {
            throw new Error('Unexpected response format');
        }

        // fetch check
        console.log('Fetched teams data:', teamsData.length, 'records');

        // create promises array to do second API call
        const teams = await Promise.all(teamsData.map(async team => {
            // get team abbreviation based on name
            const abbreviation = teamAbbreviations[team.teamFullName];
            // playoff game flag
            let hasPlayoffGames = false;

            // abbreviation check
            if (abbreviation) {
                // get playoff flag
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

            // return full data set
            return {
                id: team.teamId,
                name: team.teamFullName,
                // points = games won
                points: team.wins,
                record: `${team.losses}-${team.otLosses || 0}`,
                progress: Math.round((team.wins / 82) * 100),
                hasPlayoffGames
            };
        }));

        console.log('Processed teams data:', teams.length, 'records');

        // cache processed data
        cache.set('teams', teams); 

        // return team data in json form
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams data:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching teams data' });
    }
});

// endpoint to fetch upcoming games for a team
// "abbr" is mapped to each team in teamAbbreviations.json
app.get('/api/team/:abbr/upcoming-games', async (req, res) => {
    const { abbr } = req.params;
    try {
        const response = await axios.get('https://api-web.nhle.com/v1/schedule/now');
        // schedule data 
        // flatmap to process nested schedule data
        const scheduleData = response.data.gameWeek.flatMap(week => week.games.map(game => ({
            dayAbbrev: week.dayAbbrev,
            homeTeam: game.homeTeam.abbrev,
            awayTeam: game.awayTeam.abbrev,
            venue: game.venue.default,
            startTimeUTC: game.startTimeUTC
        })))
            // filter based on abbreviation
            .filter(game => game.awayTeam === abbr || game.homeTeam === abbr);

        // only return the latest game in the schedule
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
        // check if the abbrev matches in JSON file
        if (!Object.values(teamAbbreviations).includes(abbr)) {
            console.warn(`Team abbreviation ${abbr} not found`);
            return res.status(404).json({ message: `Team abbreviation ${abbr} not found` });
        }
        
        // if type (regular/playoff) is not one of these values, return error
        if (type !== '2' && type !== '3') {
            console.warn(`Invalid type ${type}`);
            return res.status(400).json({ message: `Invalid type ${type}` });
        }

        // player data get
        const response = await axios.get(`https://api-web.nhle.com/v1/club-stats/${abbr}/20232024/${type}`);
        const playerData = response.data.skaters;
        const goalieData = response.data.goalies;

        // more error handling
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
