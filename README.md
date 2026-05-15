# lockbox-messenger
privacy focused messenger as a learning project

# HOW TO RUN
Backend can be self hosted via docker-compose.
First navigate to backend folder.
Use command: ```docker-compose --profile dev up``` to run a containers for backend.
Dev profile ensures that database has correct tables, but data does not persist between launches.

Frontend can be started via emulator or builded to android phone (iOS not verified at all).
to run via emulator you can use command
```npx react-native run android```
note, that this requires you to have configured android studio and installed proper package.
