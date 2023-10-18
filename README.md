# TBSF Nakama Server

## Overview
This repository hosts a custom Nakama server tailored for the Turn Based Strategy Framework (TBSF), available on the [Unity Asset Store](http://u3d.as/mfd). Developed in TypeScript, this server enables TBSF to be used for online multiplayer play, complementing the [TBSF Nakama Client](https://github.com/mzetkowski/tbsf-nakama-client) implementation. It is containerized using Docker for easy deployment and managed with Docker Compose.

## Prerequisites
- Docker
- Docker Compose
- Node.js (for development)

## Custom Server Features
The server includes several specialized features for turn-based strategy games:
- **Matchmaking and Room Management**: Enables players to create, search, join, and manage game rooms, with support for both quick matches and specific room searches.
- **Player Properties Management**: Handles storing and retrieving player properties within matches, essential for tracking player readiness and other game-specific data.
- **Real-time Communication**: Manages real-time updates for player actions, ensuring a synchronized and interactive gameplay experience.

## Quick Start
1. Clone the repository
   ```
   git clone https://github.com/mzetkowski/tbsf-nakama-server.git
   ```
2. Navigate to the `ts-project` directory
   ```
   cd tbsf-nakama-server/ts-project
   ```
3. Build and start the Docker containers
   ```
   docker-compose up --build
   ```
   
## Integration with TBSF
To use this server with your TBSF project:
1. Deploy the server
2. Set up the client as described in the [TBSF Nakama Client](https://github.com/mzetkowski/tbsf-nakama-client) repository
   
## Structure
- `Dockerfile`: Defines the Docker image for the Nakama server.
- `docker-compose.yml`: Orchestrates the Nakama and PostgreSQL services.
- `package.json` and `package-lock.json`: Manages Node.js dependencies.
- `src/main.ts`: Contains the main TypeScript code for the Nakama server.

## Contact and Support
If you have any questions, feedback, or need assistance with the TBSF Nakama Server, feel free to reach out. You can contact me directly via email at crookedhead@outlook.com for specific queries or suggestions. Additionally, for broader community support and discussions, join the TBSF Discord server: [TBSF Discord](https://discord.gg/uBJNPJHFjB). This platform is ideal for connecting with other TBSF users, sharing experiences, and getting help from the community.

## Additional Notices

### Acknowledgments

This project uses the `nakama-runtime` library from Heroic Labs. `nakama-runtime` is an integral part of the Nakama server ecosystem, an open-source server designed for social and realtime games.

### Nakama Runtime Library

The `nakama-runtime` library is utilized under the terms of the Apache License 2.0. A copy of the Apache License 2.0 can be found in the `LICENSE-Nakama.md` file in this repository.

### Trademarks

This project is not endorsed by or affiliated with Heroic Labs. "Nakama" is a trademark of Heroic Labs and is used here for descriptive purposes only. The use of the "Nakama" name in this project is not intended to imply any affiliation with or endorsement by Heroic Labs.
