import React, { useState } from 'react';
import './NHLTeamCard.css';
import NewModal from './NHLModal.js';

const NHLTeamCard = ({ team }) => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // format the date string
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            timeZone: 'America/New_York',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);
        const time = `${parts.find(part => part.type === 'hour').value}:${parts.find(part => part.type === 'minute').value} ${parts.find(part => part.type === 'dayPeriod').value}`;
        const timeZone = 'EST';

        return `${time} ${timeZone}`;
    };

    return (
        <>
            <div className="nhl-team-card" style={{ backgroundColor: team.cardColor }} onClick={handleOpen}>
                <div className="team-logo">
                    <img src={team.logo} alt={`${team.name} logo`} />
                </div>
                <div className="text-container">
                    <div className="team-name">{team.name.split(' ').pop().toUpperCase()}</div>
                    <div className="team-points">W: {team.points}</div>
                    <div className="record">L: {team.record}</div>
                    <div className="upcoming-game">
                        {team.upcomingGame ? (
                            <div className="game">
                                <span>{team.upcomingGame.awayTeam} @ {team.upcomingGame.homeTeam}</span> 
                                <span>{team.upcomingGame.dayAbbrev + ': ' + formatDate(team.upcomingGame.startTimeUTC)}</span>
                            </div>
                        ) : (
                            <div></div>
                        )}
                    </div>
                </div>
            </div>
            <NewModal open={open} handleClose={handleClose} team={team} />
        </>
    );
};

export default NHLTeamCard;
