# Torproxy 0.9.1 #
A transparent TOR proxying applet for Gnome Desktop. Creates a system-wide proxy that redirects all traffic though TOR.
Based on ParrotSec's anonsurf, with a graphical frontend built as a Gnome Shell Extension.

Currently a functioning prototype. Feel free to download and play with it, but DO NOT rely on this for anonymity.
It's very early alpha! Requires installation of the `libnotify-bin` package to function properly. Made for
Debian-based systems but should work on others with Gnome. May require tweaking of some of (currently) hardcoded
variables depending on your system settings, distribution and tor installation.

**New addition:** launch a custom Torbrowser instance from the menu, configured to run in transparent proxy mode! (requires Torbrowser, obviously).


#### Screenshots ####

![Disabled](https://i.imgsafe.org/8894fd2784.png)
![Enabled](https://i.imgsafe.org/8895640fd3.png)
![Notification](http://i.imgsafe.org/b4fae1a0d4.png)
![Torbrowser](https://i.imgsafe.org/8895ff0f4e.png)


#### Installation: ####

Download and extract. `cd` into the folder and run `sudo ./install.sh`


#### Licence ####

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.


#### Acknowledgements ####

Inspired by / heavily plagiarized from the following:

- ParrotSec: https://github.com/ParrotSec/anonsurf
- Und3rf10w: https://github.com/Und3rf10w/kali-anonsurf
- BrainfuckSec: https://github.com/BrainfuckSec/kalitorify
- Subgraph OS: https://github.com/subgraph/gnome-shell-extension-torstatus
- Tor Project: https://wiki.torproject.org/noreply/TheOnionRouter/TransparentProxy


#### TODO ####

- Improve settings panel.
- Improve error handling (if TOR UID is incorrect the error is quietly passed to sys logs, not notify)
- Pull all the logic out of the shell script and into a GSE-style javascript controller
- Refactor.
- Do more to ensure the extension is distribution-agnostic
- Add gnome shell startup checks to see if Torproxy shutdown scripts were run before last system shutdown (do cleanup)
- Make fully translatable.
- Wrap everything up in an installable deb package?
- Find some collaborators. Possibly you, if you're reading this :)