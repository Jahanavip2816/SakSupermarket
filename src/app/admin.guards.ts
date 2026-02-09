import { Injectable } from "@angular/core";
import { AuthService } from "./auth/auth.service";
import { Router } from "@angular/router";

@Injectable({ providedIn: 'root' })
export class AdminGuard {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate() {
    if (this.auth.isAdmin()) return true;

    this.router.navigate(['/login']);
    return false;
  }
}
