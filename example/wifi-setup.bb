DESCRIPTION = "Package of configs and code for WiFi Web setup"
SECTION = "configuration/network"
LICENSE = "Proprietary"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "git://github.com/d-o/wifi-setup-ap.git;protocol=https;branch=main"
S = "${WORKDIR}/git"
SRCREV = "${AUTOREV}"

INHIBIT_DEFAULT_DEPS = "1"

VIRTUAL-RUNTIME_bash ?= "bash"
RDEPENDS:${PN} = "\
    ${VIRTUAL-RUNTIME_bash} \
    systemd (>= 250)\
    wpa-supplicant \
    lighttpd \
    dnsmasq \
    lighttpd-module-wstunnel \
    hostapd \
    python3-core \
    python3-logging \
    python3-netserver"

inherit systemd

# Packages provided here, base funcionality and default branding
PACKAGES += "${PN}-default"
PROVIDES += "${PN}-default"

# This may be set elsewhere ...
wwwdir ?= "/www"

do_install() {

    # Common web resources
    install -d ${D}/${wwwdir}/cfg-ap/pages
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/www/cfg-ap/pages/index.html ${D}/${wwwdir}/cfg-ap/pages/
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/www/cfg-ap/pages/index.js ${D}/${wwwdir}/cfg-ap/pages/

    # Default assets
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/www/cfg-ap/pages/default-assets ${D}/${wwwdir}/cfg-ap/pages/

    # Binaries necessary for wifi system
    install -d ${D}${sbindir}
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/usr/sbin/* ${D}${sbindir}/

    # Systemd services, targets, timers ... to /lib/systemd/system/
    install -d ${D}${systemd_system_unitdir}
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/lib/systemd/system/* ${D}${systemd_system_unitdir}

    # Systemd conf and dropins. ... to /lib/systemd/**
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/etc/systemd/* ${D}${systemd_unitdir}

    # Other services conf ... to /etc/cfg-wifi-ap/*
    install -d ${D}${sysconfdir}
    cp -R --no-dereference --preserve=mode,links -v ${S}/source/etc/cfg-wifi-ap* ${D}${sysconfdir}
}


FILES:${PN} = "\
    ${wwwdir}/cfg-ap/pages/index.html \
    ${wwwdir}/cfg-ap/pages/index.js \
    ${sbindir}/* \
    ${systemd_unitdir}/* \
    ${sysconfdir}/*"

# Default branding
FILES:${PN}-default = "${wwwdir}/cfg-ap/pages/default-assets/*"
RDEPENDS:${PN}-default = "${PN}"
# Add other brandings here as conflicting packages (maybe in a bbappend)
RCONFLICTS:${PN}-default = ""
pkg_postinst:${PN}-default () {
    if [ -n "$D" ]; then
        cd $D${wwwdir}/cfg-ap/pages
        ln -s default-assets assets
    fi
}
