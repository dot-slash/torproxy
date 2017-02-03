const St = imports.gi.St;
const Main = imports.ui.main;

const GLib = imports.gi.GLib;

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

	    this.menuChange = new PopupMenu.PopupMenuItem("Change TOR circuit");
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
    },

    toggleSwitch: function() {
        if (this.active) {
            this._tpStop();
        } else {
            this._tpStart();
        }
    },

    setState: function(newState) {
        switch (newState) {
            case 'on':
                this.icon.opacity = this.icon_active;
                this.active = true;
                this.torproxySwitch.setToggleState(true);
                this.menuChange.actor.reactive = true;
                this.menuRestart.actor.reactive = true;
                this.menuCheck.actor.reactive = true;
                break;
            case 'off':
                this.icon.opacity = this.icon_inactive;
                this.active = false;
                this.torproxySwitch.setToggleState(false);
                this.menuChange.actor.reactive = false;
                this.menuRestart.actor.reactive = false;
                this.menuCheck.actor.reactive = false;
                break;
        }
    },

    _tpStart: function() {

        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'start'], 'on');
    },

    _tpStop: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'stop'], 'off');
    },

    _tpChange: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'change'], null);
    },

    _tpRestart: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'restart'], null);
    },

    _tpCheck: function() {
        this._spawn(['pkexec', this.filepath+'/torproxy.sh', 'status'], null);
    },


    _spawn: function(argv, newState) {
        try {
            // Spawn the process
            let [exited, pid] = GLib.spawn_async(null,argv,null,
                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                null
            );

            // Set callback for process completion
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid,
                Lang.bind(this, function(pid, exitStatus, requestObj) {

                if(newState != null && exitStatus == "0") {
                    // Change Torproxy state
                    this.setState(newState);
                    // Clean up when finished
                    spawn_close_pid(pid);
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
            }));

        } catch (err) {
            if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
                throw new GLib.SpawnError({ code: GLib.SpawnError.NOENT,
                                            message: _("Command not found") });
            } else if (err instanceof GLib.Error) {
                message = err.message.replace(/.*\((.+)\)/, '$1');
                throw new (err.constructor)({ code: err.code,
                                              message: message });
            } else {
                throw err;
            }
        }
    },

    destroy: function() {
        this.parent();
    },

});
