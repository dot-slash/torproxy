// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('gnome-shell-extension-torproxy');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


function init() {
    Convenience.initTranslations();
}

const TorproxyPrefsWidget = new GObject.Class({
    Name: 'Torproxy.Prefs.Widget',
    GTypeName: 'TorproxyPrefsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
        this.parent(params);

        this.margin = 24;
        this.row_spacing = 6;
        this.orientation = Gtk.Orientation.VERTICAL;
        this._settings = Convenience.getSettings();

        let align = new Gtk.Alignment({ left_padding: 12 });
        this.add(align);

        let heading1 = '<b>' + _("Cache Settings") + '</b>';
        this.add(new Gtk.Label({ label: heading1, use_markup: true, halign: Gtk.Align.START }));

        let clear_caches = new Gtk.CheckButton({ label: _("Clear caches on startup/shutdown (requires Bleachbit)"), margin_top: 6, margin_bottom: 6 });
        this._settings.bind('clear-caches', clear_caches, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.add(clear_caches);

        let heading2 = '<b>' + _("TOR User ID") + '</b>';
        this.add(new Gtk.Label({ label: heading2, use_markup: true, halign: Gtk.Align.START, margin_top: 12 }));

        let tor_uid_label = new Gtk.Label({label: "Should be 'debian-tor' or 'tor', depending on distro", xalign: 0});
        this.add(tor_uid_label);
        let tor_uid = new Gtk.Entry();
        this._settings.bind('tor-uid', tor_uid, 'text', Gio.SettingsBindFlags.DEFAULT);
        this.add(tor_uid);


    }
});

function buildPrefsWidget() {
    let widget = new TorproxyPrefsWidget();
    widget.show_all();

    return widget;
}
