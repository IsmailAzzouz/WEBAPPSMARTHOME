import { Injectable } from '@angular/core';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly USER_STORAGE_KEY = 'currentUser'; // Key for session storage
  private currentUser: User | null = null;

  // Save the user in memory and session storage
  setUser(user: User): void {
    this.currentUser = user;
    sessionStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  // Retrieve the user from memory or session storage
  getUser(): User | null {
    if (!this.currentUser) {
      const storedUser = sessionStorage.getItem(this.USER_STORAGE_KEY);
      this.currentUser = storedUser ? JSON.parse(storedUser) : null;
    }
    return this.currentUser;
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  // Clear the user data
  logout(): void {
    this.currentUser = null;
    sessionStorage.removeItem(this.USER_STORAGE_KEY);
  }
}
