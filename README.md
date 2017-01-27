# torproxy #
A transparent TOR proxying app for Gnome Desktop on Debian-based systems. Based on ParrotSec's anonsurf,
with a graphical frontend built as a Gnome Shell Extension.

Currently a functioning prototype. Feel free to download and play with it, but DO NOT rely on this for anonymity.
It's very early alpha! Requires installation of the `libnotify-bin` package to function properly. May require tweaking
of some of (currently) hardcoded variables, depending on you system settings and tor installation.


#### Screenshots ####

![Disabled](http://i.imgsafe.org/b4f93e911a.png)
![Enabled](http://i.imgsafe.org/b4fa528073.png)
![Notification](http://i.imgsafe.org/b4fae1a0d4.png)

#### Installation: ####

Go to the extensions folder:

`$ cd ~/.local/share/gnome-shell/extensions/`

Make a new folder called `torproxy@dot.slash`:

`$ mkdir torproxy@dot.slash`

Copy the files into this new folder. Activate via the Gnome Tweak Tool under the Extensions tab.


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
- Subgraph OS: https://github.com/subgraph/gnome-shell-extension-torstatus
- Tor Project: https://wiki.torproject.org/noreply/TheOnionRouter/TransparentProxy


#### TODO ####

- Add a settings panel for customising things like tor UID.
- Make translatable.
- Wrap everything up in an installable deb package.
- Find some collaborators, possibly you if you're reading this.