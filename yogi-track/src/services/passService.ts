// Pass service for handling pass-related API calls
export interface PassData {
  passId: string;
  name: string;
  description?: string;
  duration: {
    value: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
  sessions: number;
  price: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPassData {
  userPassId: string;
  userId: string;
  passId: string | PassData;
  purchaseDate: string;
  startDate: string;
  expirationDate: string;
  sessionsRemaining: number;
  totalSessions: number;
  isActive: boolean;
  purchasePrice: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface CreatePassData {
  name: string;
  description?: string;
  duration: {
    value: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
  sessions: number;
  price: number;
}

class PassService {
  private baseURL = `${window.location.origin}/api/pass`;

  // Get auth token from localStorage
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Public methods (no auth required)
  async getAllPasses(): Promise<PassData[]> {
    const response = await fetch(`${this.baseURL}/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch passes');
    }
    return response.json();
  }

  async getPassById(passId: string): Promise<PassData> {
    const response = await fetch(`${this.baseURL}/${passId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pass');
    }
    return response.json();
  }

  // Manager-only methods
  async createPass(passData: CreatePassData): Promise<{ message: string; pass: PassData }> {
    const response = await fetch(`${this.baseURL}/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create pass');
    }

    return response.json();
  }

  async updatePass(passId: string, passData: Partial<CreatePassData>): Promise<{ message: string; pass: PassData }> {
    const response = await fetch(`${this.baseURL}/update/${passId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update pass');
    }

    return response.json();
  }

  async deletePass(passId: string): Promise<{ message: string; pass: PassData }> {
    const response = await fetch(`${this.baseURL}/delete/${passId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete pass');
    }

    return response.json();
  }

  // User methods
  async purchasePass(passId: string, paymentMethod: string = 'mock'): Promise<{ message: string; userPass: UserPassData }> {
    const response = await fetch(`${this.baseURL}/purchase/${passId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ paymentMethod }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to purchase pass');
    }

    return response.json();
  }

  async getUserPasses(): Promise<UserPassData[]> {
    const response = await fetch(`${this.baseURL}/user/my-passes`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user passes');
    }

    return response.json();
  }

  async getUserActivePasses(): Promise<UserPassData[]> {
    const response = await fetch(`${this.baseURL}/user/active-passes`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch active passes');
    }

    return response.json();
  }

  async checkValidPass(): Promise<{ hasValidPass: boolean; activePasses: UserPassData[] }> {
    const response = await fetch(`${this.baseURL}/user/check-valid`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to check valid pass');
    }

    return response.json();
  }

  // Utility methods
  formatDuration(duration: { value: number; unit: string }): string {
    const { value, unit } = duration;
    const unitName = value === 1 ? unit.slice(0, -1) : unit; // Remove 's' for singular
    return `${value} ${unitName}`;
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  getDaysRemaining(expirationDate: string): number {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

export const passService = new PassService();
