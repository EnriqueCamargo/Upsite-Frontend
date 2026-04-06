import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { FeedComponent } from './components/feed/feed';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];