import { getUserStats, getAllBadgesWithProgress } from '@/src/actions/user-stats'
import { getActiveChallenges, getCompletedChallenges, getChallengeStats } from '@/src/actions/weekly-challenges'
import { LeaderboardContent } from './leaderboard-content'

export default async function LeaderboardPage() {
    const [userStats, badges, activeChallenges, completedChallenges, challengeStats] =
        await Promise.all([
            getUserStats(),
            getAllBadgesWithProgress(),
            getActiveChallenges(),
            getCompletedChallenges(5),
            getChallengeStats(),
        ])

    return (
        <LeaderboardContent
            userStats={userStats as never}
            badges={badges}
            activeChallenges={activeChallenges as never}
            completedChallenges={completedChallenges as never}
            challengeStats={challengeStats}
        />
    )
}
