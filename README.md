# Timemark iOS Companion — starter prototype

This is a new React Native / Expo prototype inspired by the user-provided screenshots. It is not the original Timemark app and is not connected to Timemark services.

## Included in this starter
- Camera permission and camera preview
- Foreground location permission
- Capture a photo
- Show capture-time, date, location text as an on-screen overlay
- Copy the captured photo into the app's private document directory
- Placeholder tabs for reports, attendance and checklists

## Not yet implemented
- Permanently compositing the watermark into the photo pixels
- Authentication (Google, Microsoft, email)
- Teams, project membership, reports, attendance, checklist data
- Timemark API integration or cloud synchronization
- Google Drive / OneDrive OAuth
- Authenticity / photo verification
- Production-grade error handling, privacy review, and tests

## Run using a cloud development environment
1. Upload these files to a private GitHub repository.
2. Open the repository in GitHub Codespaces (browser-based).
3. In the terminal run:
   ```bash
   npm install
   npx expo start
   ```
4. To create an iOS build, configure an Expo account and EAS:
   ```bash
   npx eas-cli login
   npx eas-cli build:configure
   npx eas-cli build --platform ios --profile preview
   ```
5. A physical iPhone install generally requires valid Apple signing and device/distribution setup. An Apple Developer Program membership may be required for the chosen distribution method.

## Important
- Replace `com.example.timemarkcompanion` with a bundle identifier you control before a real build.
- Do not put passwords, access tokens, private API keys, or company secrets into source code or GitHub.
- Only connect to services and APIs for which you have permission.
- This starter does not bypass Timemark authentication or copy protected backend services.
- Camera location is not guaranteed to be accurate indoors. Confirm device time and location settings before using photos as work evidence.
