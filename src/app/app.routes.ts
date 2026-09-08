import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'signup/:id',
    loadComponent: () =>
      import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing/landing.page').then((m) => m.LandingPage),
    canActivate: [authGuard]
  },

  {
    path: 'plans',
    loadComponent: () =>
      import('./pages/plans/plans.page').then((m) => m.PlansPage),
  },
  {
    path: 'scope-and-sequence/:id',
    loadComponent: () =>
      import('./pages/scope-and-sequence/scope-and-sequence.page').then(
        (m) => m.ScopeAndSequencePage
      ),
  },
  {
    path: 'hook-a-left',
    loadComponent: () =>
      import('./pages/hook-a-left/hook-a-left.page').then(
        (m) => m.HookALeftPage
      ),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing.page').then((m) => m.PricingPage),
  },
  {
    path: 'donate',
    loadComponent: () =>
      import('./pages/donate/donate.page').then((m) => m.DonatePage),
  },
  {
    path: 'contact-us',
    loadComponent: () =>
      import('./pages/contact-us/contact-us.page').then((m) => m.ContactUsPage),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy.page').then(
        (m) => m.PrivacyPolicyPage
      ),
  },
  {
    path: 'terms-of-use',
    loadComponent: () =>
      import('./pages/terms-of-use/terms-of-use.page').then(
        (m) => m.TermsOfUsePage
      ),
  },
  {
    path: 'content',
    loadComponent: () =>
      import('./pages/hook-a-left/content/content.page').then(
        (m) => m.ContentPage
      ),
  },
  {
    path: 'lessons/:id',
    loadComponent: () =>
      import('./pages/lessons/lessons.page').then((m) => m.LessonsPage),
  },
  {
    path: 'my-profile',
    loadComponent: () =>
      import('./pages/my-profile/my-profile.page').then((m) => m.MyProfilePage),
  },
];
