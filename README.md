# Little Known

A phone-friendly multiplayer “two truths and a lie” game for 2–8 people. One player hosts a room; friends join from another device with the room code or invite link. The host starts each round, players submit three stories, everyone else guesses the lie, and correct guesses earn points.

## Play

Open [Little Known](https://little-known-game.onrender.com) in a current browser while online. Create a room, then share the room code or invite link. The page loads PeerJS from its public CDN, and rooms use PeerJS Cloud for signaling plus browser-to-browser WebRTC data connections.

## Hosting

The `main` branch of this repository is connected to Render. Changes deploy automatically to [little-known-game.onrender.com](https://little-known-game.onrender.com). PeerJS Cloud provides signaling; a small number of networks may need a TURN relay, and the host’s browser needs to stay open during play.
