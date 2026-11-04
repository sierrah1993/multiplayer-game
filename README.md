# Little Known

A phone-friendly multiplayer “two truths and a lie” game for 2–8 people. One player hosts a room; friends join from another device with the room code or invite link. The host starts each round, players submit three stories, everyone else guesses the lie, and correct guesses earn points.

## Run it

Open `index.html` in a current browser while online. The page loads PeerJS from its public CDN, and rooms use PeerJS Cloud for signaling plus browser-to-browser WebRTC data connections. No account or download is needed for players.

To share it online, publish the contents of this folder as a static site. The host’s invite link includes the room code, such as `https://your-site.example/?room=ABCDE`.

## Hosting status

The files are ready to publish. The available Render publishing route requires a Git repository URL; this workspace currently has no Git repository or remote. Once these files are in a repository connected to Render, create a Static Site with build command `echo ready` and publish path `outputs` (or place these three files at the repository root and publish `.`).

PeerJS Cloud provides signaling. A small number of networks may block direct peer connections; PeerJS documents that those cases need a TURN relay. The host’s browser must stay open during play.
