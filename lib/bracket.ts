export interface Match {
  id: string;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  team1FromMatch?: string; // e.g., "W-M1" (winner of match 1)
  team2FromMatch?: string; // e.g., "L-M2" (loser of match 2)
  winnerId?: string | null;
  day: number;
  startTime: string; // PT time
  round: string;
  isUpperBracket: boolean;
}

// Day 1 - Initial Matches
export const day1Matches: Match[] = [
  {
    id: 'M1',
    matchNumber: 1,
    team1Id: 'team-cc',
    team2Id: 't1',
    day: 1,
    startTime: '3:00 PM',
    round: 'Round 1',
    isUpperBracket: true,
  },
  {
    id: 'M2',
    matchNumber: 2,
    team1Id: 'team-falcons',
    team2Id: 'varrel',
    day: 1,
    startTime: '4:15 PM',
    round: 'Round 1',
    isUpperBracket: true,
  },
  {
    id: 'M3',
    matchNumber: 3,
    team1Id: 'al-qadsiah',
    team2Id: 'geekay-esports',
    day: 1,
    startTime: '5:30 PM',
    round: 'Round 1',
    isUpperBracket: true,
  },
  {
    id: 'M4',
    matchNumber: 4,
    team1Id: 'spacestation',
    team2Id: 'team-peps',
    day: 1,
    startTime: '6:45 PM',
    round: 'Round 1',
    isUpperBracket: true,
  },
];

// Day 2 - Upper Bracket Round 2
export const day2Matches: Match[] = [
  {
    id: 'M5',
    matchNumber: 5,
    team1Id: 'crazy-raccoon',
    team2Id: null,
    team2FromMatch: 'W-M4',
    day: 2,
    startTime: '3:00 PM',
    round: 'Upper Round 2',
    isUpperBracket: true,
  },
  {
    id: 'M6',
    matchNumber: 6,
    team1Id: 'weibo-gaming',
    team2Id: null,
    team2FromMatch: 'W-M3',
    day: 2,
    startTime: '4:45 PM',
    round: 'Upper Round 2',
    isUpperBracket: true,
  },
  {
    id: 'M7',
    matchNumber: 7,
    team1Id: 'twisted-minds',
    team2Id: null,
    team2FromMatch: 'W-M1',
    day: 2,
    startTime: '6:30 PM',
    round: 'Upper Round 2',
    isUpperBracket: true,
  },
  {
    id: 'M8',
    matchNumber: 8,
    team1Id: 'team-liquid',
    team2Id: null,
    team2FromMatch: 'W-M2',
    day: 2,
    startTime: '8:15 PM',
    round: 'Upper Round 2',
    isUpperBracket: true,
  },
];

// Day 3 - Lower Bracket Round 1 & 2
export const day3Matches: Match[] = [
  {
    id: 'M9',
    matchNumber: 9,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-M4',
    team2FromMatch: 'L-M5',
    day: 3,
    startTime: '3:00 PM',
    round: 'Lower Round 1',
    isUpperBracket: false,
  },
  {
    id: 'M10',
    matchNumber: 10,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-M7',
    team2FromMatch: 'L-M3',
    day: 3,
    startTime: '4:15 PM',
    round: 'Lower Round 1',
    isUpperBracket: false,
  },
  {
    id: 'M11',
    matchNumber: 11,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-M6',
    team2FromMatch: 'L-M1',
    day: 3,
    startTime: '5:30 PM',
    round: 'Lower Round 1',
    isUpperBracket: false,
  },
  {
    id: 'M12',
    matchNumber: 12,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-M8',
    team2FromMatch: 'L-M2',
    day: 3,
    startTime: '6:45 PM',
    round: 'Lower Round 1',
    isUpperBracket: false,
  },
  {
    id: 'M13',
    matchNumber: 13,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M9',
    team2FromMatch: 'W-M10',
    day: 3,
    startTime: '8:00 PM',
    round: 'Lower Round 2',
    isUpperBracket: false,
  },
  {
    id: 'M14',
    matchNumber: 14,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M11',
    team2FromMatch: 'W-M12',
    day: 3,
    startTime: '9:45 PM',
    round: 'Lower Round 2',
    isUpperBracket: false,
  },
];

// Day 4 - Upper Semifinals, Lower Bracket, Finals
export const day4Matches: Match[] = [
  {
    id: 'M15',
    matchNumber: 15,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M5',
    team2FromMatch: 'W-M6',
    day: 4,
    startTime: '2:00 PM',
    round: 'Upper Semifinal',
    isUpperBracket: true,
  },
  {
    id: 'M16',
    matchNumber: 16,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M7',
    team2FromMatch: 'W-M8',
    day: 4,
    startTime: '3:45 PM',
    round: 'Upper Semifinal',
    isUpperBracket: true,
  },
  {
    id: 'M17',
    matchNumber: 17,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-M15',
    team2FromMatch: 'W-M13',
    day: 4,
    startTime: '5:30 PM',
    round: 'Lower Round 3',
    isUpperBracket: false,
  },
  {
    id: 'M18',
    matchNumber: 18,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M14',
    team2FromMatch: 'W-M16',
    day: 4,
    startTime: '9:30 PM',
    round: 'Lower Round 4',
    isUpperBracket: false,
  },
];

// Day 5 (Nov 30) - Finals
export const day5Matches: Match[] = [
  {
    id: 'UBF',
    matchNumber: 19,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-M15',
    team2FromMatch: 'W-M16',
    day: 5,
    startTime: '2:00 PM',
    round: 'Upper Bracket Final',
    isUpperBracket: true,
  },
  {
    id: 'LBF',
    matchNumber: 20,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'L-UBF',
    team2FromMatch: 'W-M18',
    day: 5,
    startTime: '3:45 PM',
    round: 'Lower Bracket Final',
    isUpperBracket: false,
  },
  {
    id: 'GF',
    matchNumber: 21,
    team1Id: null,
    team2Id: null,
    team1FromMatch: 'W-UBF',
    team2FromMatch: 'W-LBF',
    day: 5,
    startTime: '6:30 PM',
    round: 'Grand Final',
    isUpperBracket: true,
  },
];

export const allMatches = [
  ...day1Matches,
  ...day2Matches,
  ...day3Matches,
  ...day4Matches,
  ...day5Matches,
];

export const bracketDays = [
  { day: 1, date: 'November 26', matches: day1Matches },
  { day: 2, date: 'November 27', matches: day2Matches },
  { day: 3, date: 'November 28', matches: day3Matches },
  { day: 4, date: 'November 29', matches: day4Matches },
  { day: 5, date: 'November 30', matches: day5Matches },
];
