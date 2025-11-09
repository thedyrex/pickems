'use client'

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import VerificationBanner from "@/components/VerificationBanner";
import { getMatchesByDay, saveUserPick, getUserPicks, DbMatch, UserPick, isDayLocked } from "@/lib/matches";
import { getTeams, Team } from "@/lib/teams";
import { getDaySettings, DaySetting, autoEnableNextDay } from "@/lib/daySettings";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, UserPick>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [daySettings, setDaySettings] = useState<DaySetting[]>([]);
  const [isFading, setIsFading] = useState(false);
  const [lockedDays, setLockedDays] = useState<Record<number, boolean>>({});
  const [emailVerified, setEmailVerified] = useState<boolean>(true); // Default to true until we check

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setLoadingData(true);
      const [teamsData, picksData, daySettingsData] = await Promise.all([
        getTeams(),
        getUserPicks(user.id),
        getDaySettings()
      ]);

      setTeams(teamsData);
      setDaySettings(daySettingsData);

      // Convert picks array to object for easy lookup
      const picksMap: Record<string, UserPick> = {};
      picksData.forEach(pick => {
        picksMap[pick.match_id] = pick;
      });
      setUserPicks(picksMap);

      // Check which days are locked based on match start times
      // and auto-enable next day when current day starts
      const lockedDaysMap: Record<number, boolean> = {};
      for (let day = 1; day <= 5; day++) {
        const isLocked = await isDayLocked(day);
        lockedDaysMap[day] = isLocked;

        // Auto-enable next day when this day becomes locked
        await autoEnableNextDay(day, isLocked);
      }
      setLockedDays(lockedDaysMap);

      // Reload day settings after auto-enable check
      const updatedDaySettings = await getDaySettings();
      setDaySettings(updatedDaySettings);

      // Check email verification status
      const { data: userData } = await supabase
        .from('users')
        .select('email_verified')
        .eq('id', user.id)
        .single();

      setEmailVerified(userData?.email_verified ?? true);

      setLoadingData(false);
    }

    loadData();
  }, [user]);

  useEffect(() => {
    async function loadMatches() {
      // Fade out
      setIsFading(true);

      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 200));

      // Load new matches
      const matchesData = await getMatchesByDay(selectedDay);
      setMatches(matchesData);

      // Fade in
      setIsFading(false);
    }

    if (!loadingData) {
      loadMatches();
    }
  }, [selectedDay, loadingData]);

  const handleSavePick = async (matchId: string, teamId: string, team1Score: number | null, team2Score: number | null) => {
    if (!user) return;

    const success = await saveUserPick(user.id, matchId, teamId, team1Score, team2Score);
    if (success) {
      // Reload user picks to get the updated data
      const picksData = await getUserPicks(user.id);
      const picksMap: Record<string, UserPick> = {};
      picksData.forEach(pick => {
        picksMap[pick.match_id] = pick;
      });
      setUserPicks(picksMap);
    }
  };

  // Redirect if not logged in, but don't show loading screen
  if (!loading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" style={{
      backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        {/* Email verification banner */}
        {user && !emailVerified && (
          <VerificationBanner userId={user.id} />
        )}

        <div className="text-center mb-3 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
            <span className="text-gray-900">PICK'</span>
            <span className="text-orange-500">EMS</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">
            Select the winners for each matchup to build your bracket
          </p>
        </div>

        {/* Day selector */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 justify-center px-1">
          {[
            { day: 1, date: 'Nov 26' },
            { day: 2, date: 'Nov 27' },
            { day: 3, date: 'Nov 28' },
            { day: 4, date: 'Nov 29' },
            { day: 5, date: 'Nov 30' },
          ].map(({ day, date }) => {
            const daySetting = daySettings.find(ds => ds.day === day);
            const isAdminDisabled = daySetting ? !daySetting.is_enabled : false;
            const isTimeLocked = lockedDays[day] ?? false;
            const isLocked = isAdminDisabled || isTimeLocked;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`${!isLocked && selectedDay !== day ? 'btn-swipe' : ''} px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  selectedDay === day
                    ? 'bg-orange-500 text-white shadow-lg'
                    : !isLocked
                    ? 'bg-gray-100 text-gray-700 hover:text-white transition-all duration-200'
                    : 'bg-gray-300 text-gray-500 hover:bg-gray-400 transition-all duration-200'
                }`}
                style={!isLocked && selectedDay !== day ? { '--swipe-color': '#f97316' } as React.CSSProperties : undefined}
              >
                <div className="text-xs sm:text-sm">Day {day}</div>
                <div className="text-[10px] sm:text-xs opacity-75 flex items-center justify-center gap-1">
                  {date}
                  {isLocked && <span>🔒</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Matches */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 transition-opacity duration-200 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}>
          {matches.map(match => {
            const daySetting = daySettings.find(ds => ds.day === selectedDay);
            const isAdminDisabled = daySetting ? !daySetting.is_enabled : false;
            const isTimeLocked = lockedDays[selectedDay] ?? false;
            const isDayLocked = isAdminDisabled || isTimeLocked;
            const isEmailUnverified = !emailVerified;

            // Disable picks if day is locked OR email is not verified
            const canMakePick = !isDayLocked && !isEmailUnverified;

            return (
              <MatchCard
                key={match.id}
                match={match}
                teams={teams}
                userPick={userPicks[match.id]}
                allUserPicks={userPicks}
                allMatches={matches}
                onSavePick={canMakePick ? handleSavePick : undefined}
              />
            );
          })}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No matches scheduled for this day</p>
          </div>
        )}
      </main>
    </div>
  );
}
