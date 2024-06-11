import React, { useState, useEffect, useCallback } from 'react';
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
                //if team 'a' has upcoming game and 'b' doesnt, it will be ordered first
                if (a.upcomingGame && !b.upcomingGame) {
                    return -1;
                }
                //if team 'b' has an upcoming game and 'a' doesnt, it will be ordered first
                if (!a.upcomingGame && b.upcomingGame) {
                    return 1;
                }
                //if both teams either have/dont have a playoff game, they are sorted by points
                //if positive value is returned, 'b' is placed before 'a'
                return b.points - a.points;
            });
            setSortedTeams(sorted);
            //set loading skeleton off when team arr length > 0 (aka there are teams to render)
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
        // account for initial 
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

    // scroll left to show the previous card
    const scrollLeft = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    // scroll right to show the next card
    const scrollRight = useCallback(()=> {
        if (currentIndex < filteredTeams.length - visibleCards) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, filteredTeams.length, visibleCards]);

    // handle arrow key navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            // determine if search bar or other input element is focused
            const activeElement = document.activeElement;
            // flag
            const isInputFocused = activeElement.tagName === 'INPUT' && activeElement.type === 'text';
    
            if (isInputFocused) {
                return; // dont trigger scroll if an input element (search bar) is focused
            }
            // if no input field in focus, handle scroll functions 
            if (event.key === 'ArrowLeft') {
               scrollLeft();
            } else if (event.key === 'ArrowRight') {
                scrollRight();
            }
        };

        // upon keydown, run handle function
        window.addEventListener('keydown', handleKeyDown);
        // event listener cleanup
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scrollLeft, scrollRight, currentIndex, visibleCards, filteredTeams.length]);

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
