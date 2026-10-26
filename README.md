# VehicleFleetApp

Mobile app for managing vehicle fleets, built as my engineering thesis at Lodz University of Technology.

Fleet owners can track their vehicles live on a map, see trip history, invite drivers and manage what each member is allowed to do. Drivers record trips straight from their phone, also in the background and without network coverage.

## Features

- **Live tracking** – vehicle locations on a map, updated in real time from the driver's phone (background location).
- **Trip history** – list of past trips and their routes drawn on a map.
- **Fleets and roles** – create fleets, add vehicles, invite members and assign roles with permissions.
- **Speeding alerts** – the speed limit for the current road is read from OpenStreetMap (Overpass API); fleet members get a push notification when a driver goes over it.
- **Offline mode** – location updates and trip actions are queued locally and sent once the connection is back.
- **Subscriptions** – paid plans with Stripe; payments are created server-side in Firebase Cloud Functions.
- **Push notifications** – invites and alerts via Firebase Cloud Messaging / Expo Notifications.

## Tech stack

| Area | Technologies |
| --- | --- |
| Mobile app | React Native, Expo, Expo Router, JavaScript |
| Backend | Firebase (Authentication, Cloud Firestore, Cloud Functions, Cloud Messaging) |
| Payments | Stripe (Payment Intents, Stripe React Native SDK) |
| Location | expo-location, expo-task-manager, OpenStreetMap Overpass API |

## Project structure

```
app/          screens (file-based routing with Expo Router)
components/   UI components (fleet list, map, modals)
services/     data access and business logic (fleets, vehicles, trips, roles, subscriptions, offline queue)
functions/    Firebase Cloud Functions (Stripe payment initialization)
hooks/        push notification setup
```

## Running locally

```bash
npm install
npx expo run:android
```

The app needs a Firebase project (`google-services.json`, `config/firebaseConfig.js`) and a Stripe secret key set for Cloud Functions:

```bash
firebase functions:config:set stripe.secret="sk_test_..."
firebase deploy --only functions
```
