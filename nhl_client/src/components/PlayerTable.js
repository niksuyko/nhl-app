import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableSortLabel from '@mui/material/TableSortLabel';

const PlayerTable = ({ title, playerData, sortConfig, requestSort, type }) => {
    // function to sort player data based on the current sort configuration
    const sortData = (data) => {
        const sortedData = [...data];
        sortedData.sort((a, b) => {
            if (sortConfig.key === 'name') {
                const nameA = `${a.firstName.default} ${a.lastName.default}`.toLowerCase();
                const nameB = `${b.firstName.default} ${b.lastName.default}`.toLowerCase();
                return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            } else {
                const compareA = a[sortConfig.key];
                const compareB = b[sortConfig.key];
                if (compareA < compareB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (compareA > compareB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
        });
        return sortedData;
    };

    // sorted player data based on the sort configuration
    const sortedPlayerData = sortData(playerData);

    // column definitions for skaters and goalies
    const skaterColumns = [
        { key: 'gamesPlayed', label: 'GP' },
        { key: 'goals', label: 'G' },
        { key: 'assists', label: 'A' },
        { key: 'points', label: 'P' },
        { key: 'plusMinus', label: '+/-' },
        { key: 'penaltyMinutes', label: 'PIM' },
        { key: 'powerPlayGoals', label: 'PPG' },
        { key: 'shorthandedGoals', label: 'SHG' },
        { key: 'gameWinningGoals', label: 'GWG' },
        { key: 'shots', label: 'S' },
        { key: 'shootingPctg', label: 'S%' },
        { key: 'avgTimeOnIcePerGame', label: 'TOI/GP' },
        { key: 'avgShiftsPerGame', label: 'Shifts' },
        { key: 'faceoffWinPctg', label: 'FOW%' }
    ];

    const goalieColumns = [
        { key: 'gamesPlayed', label: 'GP' },
        { key: 'gamesStarted', label: 'GS' },
        { key: 'goalsAgainstAverage', label: 'GAA' },
        { key: 'savePercentage', label: 'SV%' },
        { key: 'shotsAgainst', label: 'SA' },
        { key: 'saves', label: 'Saves' },
        { key: 'goalsAgainst', label: 'GA' },
        { key: 'shutouts', label: 'SO' }
    ];

    const columns = type === 'goalies' ? goalieColumns : skaterColumns;

    return (
        <TableContainer component={Paper} sx={{ marginBottom: '16px' }}>
            <div style={{ position: 'sticky', top: 0, left: 0, backgroundColor: 'white', zIndex: 3, padding: '8px 16px' }}>
                <h3 style={{ textAlign: 'left', margin: 0 }}>{title}</h3>
            </div>
            <Table stickyHeader sx={{ minWidth: 500 }} aria-label={`${title} statistics table`}>
                <TableHead>
                    <TableRow>
                        <TableCell align="left" sx={{ position: 'sticky', left: 0, top: 0, backgroundColor: 'background.paper', zIndex: 2 }}>
                            <TableSortLabel
                                active={sortConfig.key === 'name'}
                                direction={sortConfig.direction}
                                onClick={() => requestSort('name')}
                            >
                                Player
                            </TableSortLabel>
                        </TableCell>
                        {columns.map(({ key, label }) => (
                            <TableCell
                                key={key}
                                align="right"
                                sx={{ top: 0, position: 'sticky', backgroundColor: 'background.paper', zIndex: 1 }}
                            >
                                <TableSortLabel
                                    active={sortConfig.key === key}
                                    direction={sortConfig.direction}
                                    onClick={() => requestSort(key)}
                                >
                                    {label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedPlayerData.map((player) => (
                        <TableRow key={player.playerId}>
                            <TableCell component="th" scope="row" align="left" sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
                                {player.firstName.default} {player.lastName.default}
                            </TableCell>
                            {columns.map(({ key }) => (
                                <TableCell key={key} align="right">
                                    {key === 'shootingPctg' || key === 'savePercentage' || key === 'faceoffWinPctg'
                                        ? `${(player[key] * 100).toFixed(2)}`
                                        : key === 'avgTimeOnIcePerGame'
                                        ? `${(player[key] / 60).toFixed(2)}`
                                        : player[key]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PlayerTable;
