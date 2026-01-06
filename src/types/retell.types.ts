export interface RetellCallData {
    call_id: string;
    agent_id: string;
    call_type: 'inbound' | 'outbound';
    call_status: 'completed' | 'ongoing' | 'failed';
    start_timestamp: number;
    end_timestamp: number;
    duration_ms: number;

    // Audio
    recording_url: string;

    // Transcript
    transcript: string;
    transcript_object: Array<{
        role: 'agent' | 'user';
        content: string;
        timestamp: number;
    }>;

    // Analysis
    sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_score: number; // -1 to 1
    key_topics: string[];
    action_items: string[];
    summary: string;

    // Metadata
    phone_number: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    metadata?: Record<string, any>;

    // Advanced
    interruptions_count: number;
    user_sentiment_flow: Array<{ timestamp: number; sentiment: number }>;
    agent_performance: {
        clarity_score: number;
        response_time_avg: number;
        successful_responses: number;
    };
}
