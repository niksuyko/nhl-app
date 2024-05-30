import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PlayerTable from './PlayerTable';
import axios from 'axios';
import './NHLModal.css';

// component to conditionally render tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const NewModal = ({ open, handleClose, team }) => {
    // state variables
    const [goalieDataRegular, setGoalieDataRegular] = useState([]);
    const [playerDataRegular, setPlayerDataRegular] = useState([]);
    const [goalieDataPlayoff, setGoalieDataPlayoff] = useState([]);
    const [playerDataPlayoff, setPlayerDataPlayoff] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [sortConfigPlayer, setSortConfigPlayer] = useState({ key: 'gamesPlayed', direction: 'desc' });
    const [sortConfigGoalie, setSortConfigGoalie] = useState({ key: 'gamesPlayed', direction: 'desc' });

    // fetch player data
    const fetchPlayerData = async (type) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/team/${team.abbreviation}/players/${type}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching player data for type ${type}:`, error);
            return { skaters: [], goalies: [] };
        }
    };

    // fetch player and goalie data based on team and type (regular or playoff)
    useEffect(() => {
        if (team && team.abbreviation) {
            if (open && playerDataRegular.length === 0 && goalieDataRegular.length === 0) {
                fetchPlayerData('2').then((data) => {
                    setPlayerDataRegular(data.skaters);
                    setGoalieDataRegular(data.goalies);
                });
            }
            if (open && team.hasPlayoffGames && playerDataPlayoff.length === 0 && goalieDataPlayoff.length === 0) {
                fetchPlayerData('3').then((data) => {
                    setPlayerDataPlayoff(data.skaters);
                    setGoalieDataPlayoff(data.goalies);
                });
            }
        }
    }, [team, open]);

    // handle tab change
    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    // reset player data when team changes
    useEffect(() => {
        setGoalieDataRegular([]);
        setPlayerDataRegular([]);
        setGoalieDataPlayoff([]);
        setPlayerDataPlayoff([]);
    }, [team]);

    // handle sorting request for player data
    const requestSortPlayer = (key) => {
        let direction = 'desc';
        if (sortConfigPlayer.key === key && sortConfigPlayer.direction === 'desc') {
            direction = 'asc';
        } else if (sortConfigPlayer.key === key && sortConfigPlayer.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfigPlayer({ key, direction });
    };

    // handle sorting request for goalie data
    const requestSortGoalie = (key) => {
        let direction = 'desc';
        if (sortConfigGoalie.key === key && sortConfigGoalie.direction === 'desc') {
            direction = 'asc';
        } else if (sortConfigGoalie.key === key && sortConfigGoalie.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfigGoalie({ key, direction });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box className="modal-box" sx={{ overflowY: 'auto', maxHeight: '80vh' }}>
                <h2 id="modal-title">{team ? team.name : 'Loading...'}</h2>
                <Tabs value={tabIndex} onChange={handleTabChange}>
                    <Tab label="Regular Season" />
                    {team && team.hasPlayoffGames && <Tab label="Playoffs" />}
                </Tabs>
                <TabPanel value={tabIndex} index={0}>
                    <PlayerTable title="Players" playerData={playerDataRegular} sortConfig={sortConfigPlayer} requestSort={requestSortPlayer} type="skaters" />
                    <PlayerTable title="Goalies" playerData={goalieDataRegular} sortConfig={sortConfigGoalie} requestSort={requestSortGoalie} type="goalies" />
                </TabPanel>
                {team && team.hasPlayoffGames && (
                    <TabPanel value={tabIndex} index={1}>
                        <PlayerTable title="Players" playerData={playerDataPlayoff} sortConfig={sortConfigPlayer} requestSort={requestSortPlayer} type="skaters" />
                        <PlayerTable title="Goalies" playerData={goalieDataPlayoff} sortConfig={sortConfigGoalie} requestSort={requestSortGoalie} type="goalies" />
                    </TabPanel>
)}
            </Box>
        </Modal>
    );
};

export default NewModal;
