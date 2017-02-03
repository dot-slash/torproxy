#!/bin/sh

CURR_USER=`logname`
INSTALL_DIR=/home/$CURR_USER/.local/share/gnome-shell/extensions/torproxy@dot.slash
SCHEMA_DIR=/usr/share/glib-2.0/schemas
SCHEMA_NAME=org.gnome.shell.extensions.torproxy.gschema.xml

#Check permissions

if [ $(id -u) -ne 0 ]; then
    echo 'This install script requires elevated permissions. Try: "sudo ./install.sh" instead.'
    exit 1
fi

#Check for notify binary

if [ ! -e /usr/bin/notify-send ];then
    echo 'Please install notify binary first: "sudo apt-get install notify-bin"'
    exit 1
fi

#Install files

rm -r $INSTALL_DIR >&2
mkdir -p $INSTALL_DIR

for file in extension.js metadata.json prefs.js reset_prefs.sh install.sh torproxy.sh torrc README.md icons schemas; do
    cp -r ./$file $INSTALL_DIR/
done

#Set up preferences

rm $SCHEMA_DIR/$SCHEMA_NAME >&2
cp ./schemas/$SCHEMA_NAME $SCHEMA_DIR/$SCHEMA_NAME

glib-compile-schemas $SCHEMA_DIR

echo "Installation complete."
