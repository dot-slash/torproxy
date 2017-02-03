#!/bin/bash

# Get non-sudo user
CURR_USER=`logname`

# Set up user DBUS address for notifications
PID=`pgrep --newest -u $CURR_USER gnome-settings`
DBUS=`grep -z DBUS_SESSION_BUS_ADDRESS /proc/$PID/environ | tr -d '\0' | \
sed -e 's/DBUS_SESSION_BUS_ADDRESS=//'`
export DBUS_SESSION_BUS_ADDRESS=$DBUS

# The UID Tor runs as. Check /usr/share/tor/tor-service-defaults-torrc "User" field for default.
TOR_UID=`gsettings get org.gnome.shell.extensions.torproxy tor-uid | cut -d "'" -f 2`

CLEAR_CACHES=`gsettings get org.gnome.shell.extensions.torproxy clear-caches`

# Tor's VirtualAddrNetworkIPv4
VIRT_ADDR="10.192.0.0/10"

# LAN destinations that shouldn't be routed through Tor
NON_TOR="127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 127.0.0.0/9 127.128.0.0/10"

# Other IANA reserved blocks (These are not processed by tor and dropped by default)
RESV_IANA="0.0.0.0/8 100.64.0.0/10 169.254.0.0/16 192.0.0.0/24 192.0.2.0/24 192.88.99.0/24 198.18.0.0/15 198.51.100.0/24 203.0.113.0/24 224.0.0.0/3"

# Tor's TransPort
TRANS_PORT="9040"

# DNS redirect port
DNS_PORT="5353"


function notify {
	if [ -e /usr/bin/notify-send ]; then
        local notice=$1
        time=2500
        path="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        icon=$path"/icons/icon180.png"
        su "$CURR_USER" -c "notify-send Torproxy '$notice' -u low -t $time -i $icon"
	fi
}

function init {
	#notify "Killing dangerous processes and clearing cache..."

	echo -e "[Torproxy] Killing dangerous applications"
	killall -q chrome dropbox iceweasel skype icedove thunderbird firefox firefox-esr chromium xchat transmission deluge pidgin pidgin.orig

	if $CLEAR_CACHES && hash bleachbit 2>/dev/null; then
	    echo -e "[Torproxy] Clearsysing some dangerous cache elements"
	    bleachbit -c adobe_reader.cache chromium.cache chromium.current_session chromium.history elinks.history emesene.cache epiphany.cache firefox.url_history flash.cache flash.cookies google_chrome.cache google_chrome.history links2.history opera.cache opera.search_history opera.url_history &> /dev/null
    fi
}

function start {
	check_root
	disable_ufw

	# Kill IPv6 services
	echo -e "[Torproxy] Stopping IPv6 services"
	sed -i '/^.*\#Torproxy$/d' /etc/sysctl.conf
	echo "net.ipv6.conf.all.disable_ipv6=1 #Torproxy" >> /etc/sysctl.conf
	echo "net.ipv6.conf.default.disable_ipv6=1 #Torproxy" >> /etc/sysctl.conf
	sysctl -p > /dev/null

	echo -e "[Torproxy] Starting Torproxy..."
    notify "Starting TOR daemon..."

    #echo -e "[Torproxy] Tor is not running. Starting it for you"
    service network-manager force-reload > /dev/null 2>&1

    service resolvconf stop 2>/dev/null || true
    #service nscd stop 2>/dev/null || true
    #service dnsmasq stop 2>/dev/null || true
    #sleep 1
    killall dnsmasq nscd 2>/dev/null || true
    sleep 2
    service resolvconf start 2>/dev/null || true
    sleep 1
    #service tor start
    tor --defaults-torrc /usr/share/tor/tor-service-defaults-torrc -f /home/$CURR_USER/.local/share/gnome-shell/extensions/torproxy@dot.slash/torrc
    sleep 1

    # Save IP table rules
	if ! [ -f /etc/network/iptables.rules ]; then
		iptables-save > /etc/network/iptables.rules
		echo -e "[Torproxy] Saved iptables rules"
	fi

	# Flush IP tables
	iptables -F
	iptables -t nat -F

	# Set DNS resolver to use TOR
	cp -vf /etc/resolv.conf /etc/resolv.conf.backup
    echo -e 'nameserver 127.0.0.1' > /etc/resolv.conf

    # Don't nat the TOR process itself
    iptables -t nat -A OUTPUT -m owner --uid-owner $TOR_UID -j RETURN

	# Nat DNS requests to TOR
	iptables -t nat -A OUTPUT -p udp --dport 53 -j REDIRECT --to-ports $DNS_PORT
	iptables -t nat -A OUTPUT -p tcp --dport 53 -j REDIRECT --to-ports $DNS_PORT
	iptables -t nat -A OUTPUT -p udp -m owner --uid-owner $TOR_UID -m udp --dport 53 -j REDIRECT --to-ports $DNS_PORT

	# Nat .onion addresses
	iptables -t nat -A OUTPUT -p tcp -d $VIRT_ADDR -j REDIRECT --to-ports $TRANS_PORT
	iptables -t nat -A OUTPUT -p udp -d $VIRT_ADDR -j REDIRECT --to-ports $TRANS_PORT
	
	# Exclude local network addresses
	for LAN in $NON_TOR; do
		iptables -t nat -A OUTPUT -d $LAN -j RETURN
		iptables -A OUTPUT -d $LAN -j ACCEPT
	done

	# Exclude IANA reserved blocks
	for IANA in $RESV_IANA; do
        iptables -t nat -A OUTPUT -d $IANA -j RETURN
    done
	
	# Redirect all other output through TOR
	iptables -t nat -A OUTPUT -p tcp --syn -j REDIRECT --to-ports $TRANS_PORT
	iptables -t nat -A OUTPUT -p udp -j REDIRECT --to-ports $TRANS_PORT
	iptables -t nat -A OUTPUT -p icmp -j REDIRECT --to-ports $TRANS_PORT
	
	# Accept already established connections
	iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

	# Allow only TOR output
	iptables -A OUTPUT -m owner --uid-owner $TOR_UID -j ACCEPT
	iptables -A OUTPUT -j REJECT

    # Filter input
    iptables -A INPUT -m state --state ESTABLISHED -j ACCEPT
    iptables -A INPUT -i lo -j ACCEPT
	iptables -A INPUT -j DROP

	# Filter output
	iptables -A OUTPUT -m state --state INVALID -j DROP
	iptables -A OUTPUT -d 127.0.0.1/32 -o lo -j ACCEPT

	# Set default policies to DROP
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT DROP

	echo -e "[Torproxy] All traffic is now redirected through TOR"

	notify "Torproxy is up and running."
}


function stop {
	check_root

    notify "Shutting down Torproxy..."
	echo -e "[Torproxy] Stopping Torproxy..."

	iptables -F
	iptables -t nat -F
	echo -e "[Torproxy] Flushed iptables rules"
	
	if [ -f /etc/network/iptables.rules ]; then
		iptables-restore < /etc/network/iptables.rules
		rm /etc/network/iptables.rules
		echo -e "[Torproxy] Iptables rules restored"
	fi
	
	# Restore DNS settings
	if [ -e /etc/resolv.conf.backup ]; then
		rm /etc/resolv.conf
		cp /etc/resolv.conf.backup /etc/resolv.conf
	fi
	
	service tor stop >&2
	sleep 1
	killall tor >&2

	# Reenable IPv6 services
	echo -e "[Torproxy] Reenabling IPv6 services"
	sed -i '/^.*\#Torproxy$/d' /etc/sysctl.conf #delete lines containing #Torproxy in /etc/sysctl.conf
	sysctl -p

    # Reload services
	service network-manager force-reload > /dev/null 2>&1
	service nscd start > /dev/null 2>&1
	service dnsmasq start > /dev/null 2>&1
	
	echo -e "[Torproxy] Anonymous mode stopped"
    notify "Torproxy is now disabled."

    enable_ufw
}

function change {
	service tor reload
	sleep 1
	echo -e "[Torproxy] Tor daemon reloaded and forced to change nodes"

	notify "TOR service reloaded."
}

function status {
    status=`service tor status | grep Active: | sed -e 's/^.*\Active://'`
	notify "Status: $status"
}

function check_root {
    if [ $(id -u) -ne 0 ]; then
		notify "Torproxy must be run as root."
		echo -e "[Torproxy] Torproxy must be run as root" >&2
		exit 1
	fi
}

function disable_ufw () {
	if hash ufw 2>/dev/null; then
    	if ufw status | grep -q active$; then
        	echo -e "[Torproxy] Disabling ufw firewall..."
        	ufw disable
        	sleep 6
    	fi
    fi
}

function enable_ufw () {
	if hash ufw 2>/dev/null; then
    	if ufw status | grep -q inactive$; then
        	echo -e "[Torproxy] Re-enabling ufw firewall..."
        	ufw enable
        fi
    fi
}

case "$1" in
	start)
		init
		start
	;;
	stop)
		init
		stop
	;;
	change)
		change
	;;
	status)
		status
	;;
	restart)
		stop
		sleep 2
		start
	;;
    *)
        exit 1
    ;;
esac

exit 0
