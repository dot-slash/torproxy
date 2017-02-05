const St = imports.gi.St;
const Main = imports.ui.main;

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Gdk = imports.gi.Gdk;

const Shell = imports.gi.Shell;
const Util = imports.misc.util;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

let TorproxyInstance, path, theme;

function init(extensionMeta) {
    // Set path for custom icon
    path = extensionMeta.path;
    theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(path + "/icons");
}

function enable() {
    TorproxyInstance = new TorproxyMenu(path);
    Main.panel.addToStatusArea('Torproxy', TorproxyInstance);
}

function disable() {
    TorproxyInstance.destroy();
    TorproxyInstance = null;
}

const TorproxyMenu = new Lang.Class({
    Name: 'TorProxy',
    Extends: PanelMenu.Button,

    _init: function(path) {
        this.parent(null, 'TorProxy');

        this.user = GLib.get_user_name();
        this.filepath = path;
        this.active = false;

        this.icon_inactive = 120;
        this.icon_active = 235;

        this.addPanelButton();
        this.createMenu();
    },

    addPanelButton: function() {
        // Create panel button
        this.button = new St.BoxLayout({ style_class: "main-button" });
        this.icon = new St.Icon({
            icon_name: 'tor-simple-symbolic',
            style_class: 'system-status-icon'
        });
        this.icon.opacity = this.icon_inactive;
        this.button.add_actor(this.icon);
        this.actor.add_actor(this.button);

        // Change icon opacity on hover
        this.actor.connect('enter_event', Lang.bind(this, function() {
            this.icon.opacity += 20;
        }));
        this.actor.connect('leave_event', Lang.bind(this, function() {
            this.icon.opacity -= 20;
        }));
    },

    createMenu: function() {
        // Add menu items
        this.torproxySwitch = new PopupMenu.PopupSwitchMenuItem("Torproxy");
        this.torproxySwitch.connect('toggled', Lang.bind(this, this.toggleSwitch));
        this.menu.addMenuItem(this.torproxySwitch);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem);

	    this.menuChange = new PopupMenu.PopupMenuItem("New TOR circuit");
	    this.menuChange.actor.reactive = false;
	    this.menuChange.connect('activate', Lang.bind(this, this._tpChange));
	    this.menu.addMenuItem(this.menuChange);

	    this.menuRestart = new PopupMenu.PopupMenuItem("Restart Torproxy");
	    this.menuRestart.actor.reactive = false;
	    this.menuRestart.connect('activate', Lang.bind(this, this._tpRestart));
	    this.menu.addMenuItem(this.menuRestart);

	    this.menuCheck = new PopupMenu.PopupMenuItem("Check TOR status");
	    this.menuCheck.actor.reactive = false;
	    this.menuCheck.connect('activate', Lang.bind(this, this._tpCheck));
	    this.menu.addMenuItem(this.menuCheck);

	    this.menuBrowser = new PopupMenu.PopupMenuItem("Launch Torbrowser");
	    this.menuBrowser.actor.reactive = false;
	    this.menuBrowser.connect('activate', Lang.bind(this, this._tpBrowser));
	    this.menu.addMenuItem(this.menuBrowser);
    },

    toggleSwitch: function() {
        if (this.active) {
            this._tpStop();
        } else {
            this._tpStart();
        }
    },

    setState: function(newState) {
        //TODO: store the state in a preference, check on startup and clean up / restore system settings as needed

        switch (newState) {
            case 'on':
                this.icon.opacity = this.icon_active;
                this.active = true;
                this.torproxySwitch.setToggleState(true);
                this.menuChange.actor.reactive = true;
                this.menuRestart.actor.reactive = true;
                this.menuCheck.actor.reactive = true;
                this.menuBrowser.actor.reactive = true;
                break;
            case 'off':
                this.icon.opacity = this.icon_inactive;
                this.active = false;
                this.torproxySwitch.setToggleState(false);
                this.menuChange.actor.reactive = false;
                this.menuRestart.actor.reactive = false;
                this.menuCheck.actor.reactive = false;
                this.menuBrowser.actor.reactive = false;
                break;
        }
    },

    _tpStart: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'start'], 'on');
    },

    _tpStop: function() {
        //TODO: double-check to see if Torbrowser prefs backup needs restoring?

        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'stop'], 'off');
    },

    _tpChange: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'change']);
    },

    _tpRestart: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'restart']);
    },

    _tpCheck: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'status']);
    },

    _tpBrowser: function() {
        // TODO: Check browser isn't open already, deal with it if so...?

        // TODO: Check that torbrowser is actually installed... disable menu option if not.

        this._notify('Starting Torbrowser in transparent proxy mode...');

        // Back up Torbrowser preferences before launch (very important!)
        if(this._tpBackupPrefs()) {
            //TODO: set up control port for multiple TOR circuits

            // Get basic Torbrowser
            let cmd = [
                '/home/'+this.user+'/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/firefox',
                '--class Tor Browser',
                '-profile TorBrowser/Data/Browser/profile.default'
            ];

            // Environment variables (skip Vidalia on launch, etc)
            let base_env = GLib.get_environ();
            let cust_env = [
                'TOR_SKIP_LAUNCH=1',
                'TOR_TRANSPROXY=1',
                'TOR_SOCKS_HOST=10.192.0.1',
                'TOR_SOCKS_PORT=9050',
                'TOR_SKIP_CONTROLPORTTEST=1',
                'TOR_NO_DISPLAY_NETWORK_SETTINGS=1'
            ];

            // Spawn the process
            let [result, child_pid] = GLib.spawn_async(
                null, //str working directory
                cmd, //arr args
                base_env.concat(cust_env), //arr env
                GLib.SpawnFlags.DO_NOT_REAP_CHILD, //flags spawn flags
                null //func child setup function
            );

            // Attach callback (called when process ends)
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, child_pid, Lang.bind(this, function(pid, exitStatus) {
                // Resore preferences backup when Torbrowser exit code received
                this._notify("Shutting down transparent proxy Torbrowser...");
                this._tpRestorePrefs();
                GLib.spawn_close_pid(pid);
            }));

        } else {
            // Failed to back up pref.js (don't open the browser!)
            this._notify("Failed to back up Torbrowser system preferences");
        }
    },

    _tpBackupPrefs: function() {
        let prefs_path = '/home/'+this.user+'/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/TorBrowser/Data/Browser/profile.default/prefs.js';
        let prefs_file = Gio.File.new_for_path(prefs_path);
        let prefs_backup = Gio.File.new_for_path(prefs_path+'.backup');

        if(prefs_backup.query_exists(null)) {
            //Backup already exists... fine?
        }

        if(prefs_file.query_exists(null)) {
            //Save backup.

            //This messy prefs.js backup hack is important as Torbrowser currently alters it's settings when using
            //the 'TOR_SKIP_LAUNCH=1' and 'TOR_TRANSPROXY=1' options, but they don't get changed back. This can leave
            //the Torbrowser broken when launching it normally with Vidalia when not using the transparent proxy.
            //https://trac.torproject.org/projects/tor/ticket/17615

            if(prefs_file.copy(prefs_backup, Gio.FileCopyFlags.OVERWRITE, null, null, null)) {
                this._notify("Backed up Torbrowser system preferences");
                return true;
            } else {
                //this._notify("Failed to back up Torbrowser preferences"); //Handed elsewhere
            }
        }

        return false;
    },

    _tpRestorePrefs: function() {
        let prefs_path = '/home/'+this.user+'/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/TorBrowser/Data/Browser/profile.default/prefs.js';
        let prefs_file = Gio.File.new_for_path(prefs_path);
        let prefs_backup = Gio.File.new_for_path(prefs_path+'.backup');

        if(prefs_backup.query_exists(null)) {
            //Restore prefs from backup
            if(prefs_backup.copy(prefs_file, Gio.FileCopyFlags.OVERWRITE, null, null, null)) {
                //Delete backup
                prefs_backup.delete_async(GLib.PRIORITY_DEFAULT, null, null);
                this._notify("Restored Torbrowser system preferences");
                return true;
            }
        } else {
            // Backup not found
            this._notify("Failed to restore Torbrowser system preferences: backup file not found");
        }

        return false;
    },

    _spawn: function(argv, newState) {
        try {
            // Spawn the process
            let [result, child_pid] = GLib.spawn_async(
                null, //str working directory
                argv, //arr arguments
                null, //arr environment variables
                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, //flags spawn flags
                null //func child setup function
            );

            // Set callback for process completion
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, child_pid,
                Lang.bind(this, function(pid, exitStatus, requestObj) {

                // If changing Torproxy active state
                if(newState != null && exitStatus == "0") {
                    // Change Torproxy state if successful
                    this.setState(newState);
                } else if (newState != null && exitStatus != "0") {
                    //Reset switch class if process failed
                    switch (newState) {
                        case 'on':
                            this.torproxySwitch.setToggleState(false);
                            break;
                        case 'off':
                            this.torproxySwitch.setToggleState(true);
                            break;
                    }
                }

                // Clean up when finished.
                GLib.spawn_close_pid(pid);
            }));

        } catch (err) {
            // Handle errors
            if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
                throw new GLib.SpawnError({ code: GLib.SpawnError.NOENT, message: _("Command not found") });
            } else if (err instanceof GLib.Error) {
                message = err.message.replace(/.*\((.+)\)/, '$1');
                throw new (err.constructor)({ code: err.code, message: message });
            } else {
                throw err;
            }
        }
    },

    _notify: function(notifyMessage) {
        global.log("[Torproxy] "+notifyMessage);
        GLib.spawn_command_line_async("notify-send Torproxy '"+notifyMessage+"' -u low -t 2500 -i "+path+"/icons/icon180.png");
    },

    destroy: function() {
        this.parent();
    },

});
