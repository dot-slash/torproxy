# torproxy #
A transparent TOR proxying app for Gnome Desktop on Debian-based systems.

Currently a functioning prototype. Requires installation of `libnotify-bin` to function properly.


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