interface OrganizationMetrics {
    active_users: number;
    total_users: number;
    api_calls_30d: number;
    storage_gb: number;
    calls_made: number;
    revenue: number;
    subscription_status: string;
    open_tickets: number;
    features_used: string[];
    last_login_days_ago: number;
    payment_failures: number;
    error_rate: number;
}

interface HealthBreakdown {
    overall: number;
    engagement: number;
    adoption: number;
    payment: number;
    support: number;
    technical: number;
}

export function calculateHealthScore(org: OrganizationMetrics): HealthBreakdown {
    // 1. USER ENGAGEMENT (30 points)
    const activeUserRatio = org.total_users > 0 ? org.active_users / org.total_users : 0;
    const apiCallsPerUser = org.active_users > 0 ? org.api_calls_30d / org.active_users : 0;
    const daysSinceLogin = org.last_login_days_ago;

    let engagementScore = 30;

    // Active user ratio
    if (activeUserRatio >= 0.9) engagementScore -= 0;
    else if (activeUserRatio >= 0.7) engagementScore -= 5;
    else if (activeUserRatio >= 0.5) engagementScore -= 10;
    else engagementScore -= 15;

    // API usage
    if (apiCallsPerUser >= 1000) engagementScore -= 0;
    else if (apiCallsPerUser >= 500) engagementScore -= 3;
    else if (apiCallsPerUser >= 100) engagementScore -= 7;
    else engagementScore -= 10;

    // Last login
    if (daysSinceLogin <= 1) engagementScore -= 0;
    else if (daysSinceLogin <= 7) engagementScore -= 2;
    else if (daysSinceLogin <= 14) engagementScore -= 5;
    else engagementScore -= 8;

    engagementScore = Math.max(0, engagementScore);

    // 2. FEATURE ADOPTION (25 points)
    const totalFeatures = 5; // invoices, quotes, calls, tasks, pipeline
    const featuresUsedCount = org.features_used.length;
    const adoptionScore = Math.round((featuresUsedCount / totalFeatures) * 25);

    // 3. PAYMENT STATUS (25 points)
    let paymentScore = 25;

    if (org.subscription_status === 'active') paymentScore = 25;
    else if (org.subscription_status === 'trial') paymentScore = 20;
    else if (org.subscription_status === 'past_due') paymentScore = 10;
    else if (org.subscription_status === 'canceled') paymentScore = 0;

    // Deduct for payment failures
    paymentScore -= org.payment_failures * 5;
    paymentScore = Math.max(0, paymentScore);

    // 4. SUPPORT HEALTH (10 points)
    let supportScore = 10;

    if (org.open_tickets === 0) supportScore = 10;
    else if (org.open_tickets <= 2) supportScore = 8;
    else if (org.open_tickets <= 5) supportScore = 5;
    else supportScore = 0;

    // 5. TECHNICAL HEALTH (10 points)
    let technicalScore = 10;

    if (org.error_rate <= 0.5) technicalScore = 10;
    else if (org.error_rate <= 1) technicalScore = 8;
    else if (org.error_rate <= 2) technicalScore = 5;
    else if (org.error_rate <= 5) technicalScore = 3;
    else technicalScore = 0;

    // TOTAL HEALTH SCORE
    const overall = engagementScore + adoptionScore + paymentScore + supportScore + technicalScore;

    return {
        overall: Math.round(overall),
        engagement: Math.round((engagementScore / 30) * 100),
        adoption: Math.round((adoptionScore / 25) * 100),
        payment: Math.round((paymentScore / 25) * 100),
        support: Math.round((supportScore / 10) * 100),
        technical: Math.round((technicalScore / 10) * 100),
    };
}

export function getHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
}

export function getHealthColor(score: number) {
    const status = getHealthStatus(score);
    return {
        excellent: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
        good: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
        warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
        critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
    }[status];
}

export function getHealthLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'At Risk';
    return 'Critical';
}
