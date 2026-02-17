import { redirect } from 'next/navigation'

export default function StatsRedirect() {
    redirect('/learn/progress?tab=stats')
}
