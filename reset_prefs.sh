#!/bin/sh

#This script is for development purposes

SCHEMA_DIR=/usr/share/glib-2.0/schemas
SCHEMA_NAME=org.gnome.shell.extensions.torproxy.gschema.xml

#Check permissions

if [ $(id -u) -ne 0 ]; then
    echo 'This script needs higher permissions. Try: "sudo ./reset_prefs.sh" instead.'
    exit 1
fi

#Reset preferences

rm $SCHEMA_DIR/$SCHEMA_NAME >&2
cp ./schemas/$SCHEMA_NAME $SCHEMA_DIR/$SCHEMA_NAME

glib-compile-schemas $SCHEMA_DIR

echo "Preferences recompiled."
