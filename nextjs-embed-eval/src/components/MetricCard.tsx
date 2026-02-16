import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

interface MetricCardProps {
    title: string
    value: string | number
    description?: string
    icon?: React.ReactNode
}

export function MetricCard({ title, value, description, icon }: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}
