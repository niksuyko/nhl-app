import React, { useEffect, useState, useCallback } from 'react';
import Header from './components/Header';
import NHLTeamContainer from './components/NHLTeamContainer';
import ColorThief from 'colorthief';
import teamAbbreviations from './teamAbbreviations.json';
import './App.css';

function App() {
    // state variables
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamsWithColors, setTeamsWithColors] = useState([]);

    // fetch teams and their upcoming games
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/teams');
                const data = await response.json();

                const teamsWithLogos = data.map(team => ({
                    ...team,
                    logo: `${process.env.PUBLIC_URL}/assets/images/${team.name}.png`,
                    abbreviation: teamAbbreviations[team.name]
                }));

                const teamsWithUpcomingGames = await Promise.all(teamsWithLogos.map(async (team) => {
                    try {
                        const gamesResponse = await fetch(`http://localhost:3001/api/team/${team.abbreviation}/upcoming-games`);
                        const upcomingGame = await gamesResponse.json();
                        return {
                            ...team,
                            upcomingGame
                        };
                    } catch (error) {
                        console.error(`Error fetching upcoming game for ${team.name}:`, error);
                        return {
                            ...team,
                            upcomingGame: null
                        };
                    }
                }));

                setTeams(teamsWithUpcomingGames);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // get dominant team colors using ColorThief
    const updateTeamColors = useCallback(() => {
        const colorThief = new ColorThief();
        const promises = teams.map(team => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = team.logo;
                img.onload = () => {
                    const color = colorThief.getColor(img);
                    const washedOutColor = `rgb(
                        ${Math.min(255, color[0] + (255 - color[0]) * 0.4)},
                        ${Math.min(255, color[1] + (255 - color[1]) * 0.4)},
                        ${Math.min(255, color[2] + (255 - color[2]) * 0.4)}
                    )`;
                    resolve({ ...team, cardColor: washedOutColor });
                };
            });
        });

        Promise.all(promises).then(updatedTeams => {
            setTeamsWithColors(updatedTeams);
        }).catch(error => {
            console.error('Error updating team colors:', error);
        });
    }, [teams]);

    // trigger color update when teams data is available
    useEffect(() => {
        if (teams.length > 0) {
            updateTeamColors();
        }
    }, [teams, updateTeamColors]);

    return (
        <div className="App">
            <Header />
            <NHLTeamContainer
                teams={teamsWithColors}
                loading={loading}
            />
        </div>
    );
}

export default App;
