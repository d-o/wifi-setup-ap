# Code and configuration files for a WiFi setup access point

An opinionated suite of services that run to create a transient AP on wlan0 for WiFi provisioning targetted at headless embedded linux devices. Makes extensive use of [systemd][T1] service mechanism to control the services needed and [wpa_suppicant][T2] as the wifi station manager.

Starting the target group `cfg-ap.target` starts the AP, it will remain active until 5 minutes from last user input.

Failure of the service [`systemd-networkd-wait-online.service`][T3] starts the AP, it is up to the distributor to select what *online* is. Restarts the wait online service once a user enters WiFi details, if online fails again the AP is relaunched.

Starting `cfg-ap.target` at anytime will also launch the AP, but disconnect from any wlan network.

[T1]: https://systemd.io/ "Main systemd docs"
[T2]: https://wireless.docs.kernel.org/en/latest/en/users/documentation/wpa_supplicant.html "WPA Supplicant documentation"
[T3]: https://systemd.io/NETWORK_ONLINE/ "How systemd interprets online"

## Packaging and installaion

### Packaging

This repository doesn't do any packaging of the files, it is designed to be installed as part of a [Yocto][P1] system build. An example recipe, tested with Yocto `scarthgap` is [included](./example/wifi-setup.bb).

It's runtime dependencies are also set in a recipe for the target it is packaged for, a recipe should include at least the following;

```
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
```

It also depends on a network config for the wlan interface that supplies a basic dhcp server, for example;

```
you@yours:~# cat /lib/systemd/network/80-wifi-ap-portal.network
# A wirelesss AP setup designed to be used as a captive portal

[Match]
Type=wlan
WLANInterfaceType=ap

[Network]
# Base address of network, with DHCP server
Address=192.168.69.1/28
DHCPServer=yes

[DHCPServer]
# For a captive portal, emit `self` as the DNS
# Assumes that there is a DNS server available
# to do the rest.
EmitDNS=yes
DNS=192.168.69.1
# Send the captive portal option
SendOption=114:string:http://wifi.setup/index.html
```

The address chosen for the server here is picked up and used by the rest of the system at runtime.

### Installation

Installation depends on the packaging method of the distribution.

[P1]: https://www.yoctoproject.org/ "Yocto project home"
