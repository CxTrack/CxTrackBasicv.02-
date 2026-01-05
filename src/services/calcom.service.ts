class CalComService {
  private baseURL = 'https://api.cal.com/v1';
  private apiKey: string = '';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('Cal.com API key not set');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cal.com API error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async getBookings(params?: {
    from?: string;
    to?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/bookings?${queryParams}`);
  }

  async getBooking(bookingId: string) {
    return this.request(`/bookings/${bookingId}`);
  }

  async createBooking(data: {
    eventTypeId: number;
    start: string;
    end: string;
    name: string;
    email: string;
    metadata?: any;
  }) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleBooking(bookingId: string, newStart: string, newEnd: string) {
    return this.request(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ start: newStart, end: newEnd }),
    });
  }

  async getEventTypes() {
    return this.request('/event-types');
  }

  async getAvailability(params: {
    eventTypeId: number;
    dateFrom: string;
    dateTo: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/availability?${queryParams}`);
  }

  async syncBookings() {
    const bookings = await this.getBookings();

    const events = bookings.map((booking: any) => ({
      title: booking.title || 'Meeting',
      description: booking.description,
      start_time: booking.startTime,
      end_time: booking.endTime,
      attendee_name: booking.attendees?.[0]?.name,
      attendee_email: booking.attendees?.[0]?.email,
      meeting_url: booking.location,
      status: booking.status === 'ACCEPTED' ? 'confirmed' : 'scheduled',
      cal_com_event_id: booking.id?.toString(),
      calcom_booking_uid: booking.uid,
      event_type: 'appointment',
      color: '#6366f1',
    }));

    return events;
  }
}

export const calComService = new CalComService();
