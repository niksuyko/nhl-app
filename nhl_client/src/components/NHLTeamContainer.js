import React, { useState, useEffect } from 'react';
import NHLTeamCard from './NHLTeamCard';
import './NHLTeamContainer.css';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const NHLTeamContainer = ({ teams, handleOpen }) => {
    // state variables
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sortedTeams, setSortedTeams] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCards, setVisibleCards] = useState(4);

    // sort teams by upcoming game and points, and set loading to false when done
    useEffect(() => {
        if (teams.length > 0) {
            const sorted = [...teams].sort((a, b) => {
                if (a.upcomingGame && !b.upcomingGame) {
                    return -1;
                }
                if (!a.upcomingGame && b.upcomingGame) {
                    return 1;
                }
                return b.points - a.points;
            });
            setSortedTeams(sorted);
            setLoading(false);
        }
    }, [teams]);

    // adjust the number of visible cards based on window size
    useEffect(() => {
        const handleResize = () => {
            const containerWidth = window.innerWidth - 130; // Subtract padding/margin
            const cardWidth = 290 + 60; // Card width + gap
            const cardsToShow = Math.min(4, Math.floor(containerWidth / cardWidth)); // Max 4 cards
            setVisibleCards(cardsToShow < 1 ? 1 : cardsToShow);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // reset currentIndex to 0 whenever searchQuery changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [searchQuery]);

    // handle search input change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // filter teams based on search query
    const filteredTeams = sortedTeams.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // handle arrow key navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' && activeElement.type === 'text';

            if (isInputFocused) {
                return; // dont trigger scroll if an input element is focused
            }

            if (event.key === 'ArrowLeft') {
                scrollLeft();
            } else if (event.key === 'ArrowRight') {
                scrollRight();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, visibleCards, filteredTeams.length]);

    // scroll left to show the previous card
    const scrollLeft = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // scroll right to show the next card
    const scrollRight = () => {
        if (currentIndex < filteredTeams.length - visibleCards) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    return (
        <>
            <div className="nhl-team-container-wrapper">
                <ChevronLeftOutlined
                    className="scroll-arrow"
                    style={{ fontSize: 100 }}
                    onClick={scrollLeft}
                />
                <div className="nhl-team-container">
                    {loading
                        ? Array.from({ length: visibleCards }).map((_, index) => (
                            <Box key={index} className="nhl-team-card">
                                <Skeleton variant="rectangular" width={250} height={450} />
                            </Box>
                          ))
                        : filteredTeams.slice(currentIndex, currentIndex + visibleCards).map((team) => (
                            <NHLTeamCard key={team.id} team={team} handleOpen={handleOpen} />
                          ))}
                </div>
                <ChevronRightOutlined
                    className="scroll-arrow"
                    style={{ fontSize: 100 }}
                    onClick={scrollRight}
                />
            </div>
            <input
                type="text"
                placeholder="Search teams"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-bar"
                autoFocus
            />
        </>
    );
};

export default NHLTeamContainer;
