## Mobile app structure

This folder is the React Native / Expo / Supabase version of the project layout.

### Structure

```text
mobile/
  app/
    (auth)/
    (tabs)/
  src/
    features/
      community/
        services/
      help/
        services/
      leaderboard/
        services/
      mood/
        services/
      profile/
        services/
      todos/
        services/
    lib/
      supabase/
      utils/
```

### Notes

- `app/` is reserved for Expo Router screens and layouts.
- `src/features/*/services` contains Supabase-backed data functions for each domain.
- `src/lib/supabase` contains the shared client bootstrap and auth helper.
- `src/lib/utils` contains small shared helpers used across features.

### Expected Expo setup

Use these packages in the mobile app:

- `expo`
- `expo-router`
- `react-native-url-polyfill`
- `@react-native-async-storage/async-storage`
- `@supabase/supabase-js`

Set these environment variables in Expo:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Do not use a Supabase `service_role` key in the mobile app.
