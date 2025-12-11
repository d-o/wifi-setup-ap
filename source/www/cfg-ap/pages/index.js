/****************************/
/*  GLOBAL STATE            */
/****************************/

let websocketMessage = [];
let listNetworks = [];
let selectedNetwork = "";
let networkEnabled = false;

const webSocketMessageTimeout = 18000;


/****************************/
/*  WHITE LABELLING          */
/****************************/

document.querySelectorAll(".whitelabel").forEach((element) => {
  element.textContent = brand;
});

if (brand_device_image) {
  img_e = document.getElementById("device-image");
  img_e.src = img_e.src + brand_device_image;
  document.getElementById("device-image-container").classList.remove("hidden");
}

document.getElementById("wifi-setup-link").textContent = brand_setup_link;
document.getElementById("next-steps-whitelabel").textContent = brand_next_steps;
document.getElementById("brand-redirect").href = brand_redirect;

/****************************/
/*  WEBSOCKET               */
/****************************/

window.cfg_globals = {};
window.addEventListener('load', () => {
  cfg_globals.ws = new WebSocket("ws://" + window.location.host + "/ws/wpa_cli/");
  cfg_globals.ws.addEventListener("open", () => {
    console.log("Websocket up");
  })
  cfg_globals.ws.addEventListener("close", (e) => {
    document.getElementById("wifi-connect-loading-spinner").classList.remove("hidden");
    console.log("Socket closed (reason :" + e.reason + ") clean :" + e.wasClean);
    if (networkEnabled) {
      window.location.replace(brand_redirect);
    } else {
      document.getElementById("begin-setup-tab").classList.add("hidden");
      document.getElementById("network-list-tab").classList.add("hidden");
      document.getElementById("connect-network-tab").classList.add("hidden");
      document.getElementById("no-websocket-tab").classList.remove("hidden");
    }
  })
  cfg_globals.ws.addEventListener("message", (e) => {

    // Converts the WPA CLI output to JSON format
    function convertToJSON(output) {
      let lines = output.trim().split('\n');
      let keys = []
      if (lines[1]) {
        keys = lines[1].split(' / ');
      }

      if (keys.some(key => key.includes(' '))) {
        keys = keys.map(key => key.replace(' ', '_'));
      }

      const result = [];

      for (let i = 2; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const obj = {};

        for (let j = 0; j < keys.length; j++) {
          obj[keys[j]] = values[j];
        }

        result.push(obj);
      }

      return result;
    };

    //All data sent from the device is URI (%) encoded
    // decode it here first
    let decodedData = decodeURIComponent(e.data)

    let JSONoutput = convertToJSON(decodedData);
    if (JSONoutput.length > 0) {
      websocketMessage = JSONoutput;
    } else {
      websocketMessage = decodedData;
    }
    console.log(websocketMessage);
  })
});

function waitForNetworkList(timeout) {
  const start = Date.now();
  let retries = 0;

  return new Promise(waitForMessage);

  async function waitForMessage(resolve, reject) {
    const networkListPopulated = websocketMessage && Array.isArray(websocketMessage) && websocketMessage.length > 0;
    const networkListEmpty = (websocketMessage && !Array.isArray(websocketMessage)) || (websocketMessage && Array.isArray(websocketMessage) && websocketMessage.length === 0);

    if (networkListPopulated) {
      resolve(websocketMessage);
    } else if (networkListEmpty) {
      if (retries > 0) {
        if (retries <= 2) { // Only retry twice
          await cfg_globals.ws.send("scan\n scan_results\n");
          retries++;
          setTimeout(waitForMessage.bind(this, resolve, reject), 4000);
        } else {
          reject(new Error("No networks found"));
        }
      } else {
        // Stops instant retry when message returns the first time
        retries++;
        setTimeout(waitForMessage.bind(this, resolve, reject), 4000);
      }
    }
    else if (timeout && (Date.now() - start) >= timeout) {
      reject(new Error("Message timeout"));
    }
    else {
      retries++;
      setTimeout(waitForMessage.bind(this, resolve, reject), 4000);
    }
  }
}

/****************************/
/*  STEP 1 - SCAN NETWORKS  */
/****************************/

const networkButtons = document.querySelectorAll("#scan-networks-button, #rescan-networks-button");

networkButtons.forEach((networkButton) => {
  networkButton.addEventListener("click", async function () {

    document.getElementById("scan-networks-loading-spinner").classList.remove("hidden");

    await cfg_globals.ws.send("scan\n scan_results\n");

    waitForNetworkList(webSocketMessageTimeout).then((result) => {
      renderListNetworks(result);
      document.getElementById("scan-networks-loading-spinner").classList.add("hidden");
      document.getElementById("begin-setup-tab").classList.add("hidden");
      document.getElementById("step-1").classList.add("nav-step-completed");
      document.getElementById("step-1").classList.remove("nav-active-step");
      document.getElementById("step-2").classList.add("nav-active-step");
      document.getElementById("nav-progress-track").classList.add("nav-progress-track-step-2");
      document.getElementById("network-list-tab").classList.remove("hidden");
      websocketMessage = [];
    }).catch((error) => {
      document.getElementById("list-networks-error").textContent = (error.toString() + ", please try again or refresh the page.");
      document.getElementById("list-networks-error").classList.remove("hidden");
      document.getElementById("scan-networks-loading-spinner").classList.add("hidden");
    });
  });
});

/******************************/
/* STEP 2 -WIFI NETWORKS LIST */
/******************************/

function renderWifiIcon(node) {
  const wifiIconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const wifiIconPath = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );

  wifiIconSvg.setAttribute('viewBox', '0 0 122.878 88.858');
  wifiIconSvg.setAttribute('width', 28)
  wifiIconSvg.setAttribute('height',28)
  wifiIconSvg.classList.add('network-icon');

  wifiIconPath.setAttribute(
    "d",
    "M17.215,43.332l10.399,10.57c1.096-1.28,2.282-2.497,3.551-3.642c7.666-6.908,18.284-11.183,30.038-11.183v0.029h0.001h0"
    + " v-0.029c11.754,0,22.373,4.275,30.039,11.184c1.416,1.276,2.73,2.644,3.93,4.09l10.489-10.489 c-1.408-1.612-2.919-3.146-4.525-4.594c-10.243-9.233-24.363-14.944-39.932-14.944v-0.029h0h-0.001v0.029"
    + " c-15.567,0-29.688,5.711-39.931,14.944C19.843,40.555,18.489,41.913,17.215,43.332L17.215,43.332z M61.656,48.555L61.656,48.555 l0.001,0.028c10.656,0.001,20.332,3.913,27.358,10.237l0.003,0.002l-8.575,8.575l-1.977,1.848 c-4.388-3.666-10.294-5.908-16.81-5.908v0.029h-0.001h-0.001v-0.029c-6.846,0-13.019,2.476-17.464,6.477"
    + " c-0.111,0.1-0.221,0.2-0.33,0.302L33.86,59.221c0.145-0.135,0.29-0.268,0.438-0.4C41.324,52.496,51,48.584,61.655,48.583 L61.656,48.555L61.656,48.555L61.656,48.555z M61.933,71.679c4.264,0,8.143,1.648,11.036,4.341L60.5,88.858L49.909,77.021 C52.875,73.74,57.163,71.679,61.933,71.679L61.933,71.679z"
    + " M10.005,34.716c0.629-0.616,1.272-1.22,1.929-1.813 c12.421-11.195,29.61-18.121,48.619-18.121v0.029h0.001l0,0v-0.029c19.01,0,36.198,6.926,48.619,18.122 c1.122,1.011,2.204,2.058,3.246,3.137l10.458-10.458c-1.226-1.262-2.496-2.487-3.811-3.672"
    + " C104.068,8.392,83.378,0.029,60.555,0.029V0l0,0h-0.001v0.029c-22.823,0-43.513,8.363-58.512,21.882 C1.348,22.535,0.668,23.171,0,23.818L10.005,34.716L10.005,34.716z"
  );

  wifiIconSvg.appendChild(wifiIconPath);

  return node.appendChild(wifiIconSvg);
}

function renderListNetworks(listNetworks) {

  // Clears the list of networks if we are rescanning
  document.getElementById('wifi-networks').innerHTML = "";

  let listNetworksFiltered = listNetworks.filter(
    (obj, index) =>
      (listNetworks.findIndex((item) => item.ssid === obj.ssid) === index) && (obj.ssid !== "")
  );

  for (let i = 0; i < listNetworksFiltered.length; i++) {
    const networkRow = document.createElement('div');
    const networkDetails = document.createElement('div');
    const networkName = document.createElement('p');
    const networkNameText = document.createTextNode(listNetworksFiltered[i].ssid);

    networkName.classList.add('network-name');
    networkDetails.classList.add('network-details');
    networkRow.classList.add('network-row');

    networkName.setAttribute("id", "network-name-" + i);

    renderWifiIcon(networkDetails);

    networkName.addEventListener("click", function(e) {
      selectedNetworkText = e.target.textContent;
      document.getElementById("wifi-ssid-selected").textContent = selectedNetworkText; // Display the parsed SSID for the user

      document.getElementById("network-list-tab").classList.add("hidden");
      document.getElementById("step-2").classList.add("nav-step-completed");
      document.getElementById("step-2").classList.remove("nav-active-step");
      document.getElementById("step-3").classList.add("nav-active-step");
      document.getElementById("nav-progress-track").classList.remove("nav-progress-track-step-2");
      document.getElementById("nav-progress-track").classList.add("nav-progress-track-step-3");
      document.getElementById("set-network-credentials-tab").classList.remove("hidden");
    });

    networkName.appendChild(networkNameText);
    networkDetails.appendChild(networkName);
    networkRow.appendChild(networkDetails);
    document.getElementById('wifi-networks').appendChild(networkRow);
  }
}

/****************************/
/*  STEP 3 - CREDENTIALS    */
/****************************/

const goBackToSelectNetworkButton = document.getElementById("go-back-to-select-button");
goBackToSelectNetworkButton.addEventListener("click", function() {
  document.getElementById("set-network-credentials-tab").classList.add("hidden");
  document.getElementById("step-2").classList.remove("nav-step-completed");
  document.getElementById("step-3").classList.remove("nav-active-step");
  document.getElementById("step-2").classList.add("nav-active-step");
  document.getElementById("nav-progress-track").classList.remove("nav-progress-track-step-3");
  document.getElementById("nav-progress-track").classList.add("nav-progress-track-step-2");
  document.getElementById("network-list-tab").classList.remove("hidden");
});

const setCredentialsButton = document.getElementById("wifi-set-credentials-button");
setCredentialsButton.addEventListener("click", async function() {

  const password = document.getElementById("wifi-password-input").value;
  const ssid = document.getElementById("wifi-ssid-selected").textContent;

  await cfg_globals.ws.send(`remove_network all \n`);

  /* Send back the ssid and psk as URI encoded space separated
   * This saves a temporary new config file ... the `return` method
   * will commit it ... */
  await cfg_globals.ws.send(`set-wifi-network `
    + encodeURIComponent(ssid)
    + ` ` + encodeURIComponent(password) + `\n`);

  document.getElementById("set-network-credentials-tab").classList.add("hidden");
  document.getElementById("step-3").classList.add("nav-step-completed");
  document.getElementById("step-3").classList.remove("nav-active-step");
  document.getElementById("step-4").classList.add("nav-active-step");
  document.getElementById("nav-progress-track").classList.remove("nav-progress-track-step-3");
  document.getElementById("nav-progress-track").classList.add("nav-progress-track-step-4");
  document.getElementById("connect-network-tab").classList.remove("hidden");
});

/****************************/
/*  STEP 4 - SUBMIT         */
/****************************/

const goBackToCredentialsButton = document.getElementById("go-back-to-credentials-button");
goBackToCredentialsButton.addEventListener("click", function() {
  cfg_globals.ws.send("remove_network all\n");

  document.getElementById("connect-network-tab").classList.add("hidden");
  document.getElementById("step-3").classList.remove("nav-step-completed");
  document.getElementById("step-4").classList.remove("nav-active-step");
  document.getElementById("step-3").classList.add("nav-active-step");
  document.getElementById("nav-progress-track").classList.remove("nav-progress-track-step-4");
  document.getElementById("nav-progress-track").classList.add("nav-progress-track-step-3");
  document.getElementById("set-network-credentials-tab").classList.remove("hidden");
});

const connectNetworkButton = document.getElementById("wifi-connect-submit-button");
connectNetworkButton.addEventListener("click", async function() {
  document.getElementById("wifi-connect-loading-spinner").classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("redirect-text").classList.remove("hidden");
  }, 20000);

  /* This saves and commits the new config */
  await cfg_globals.ws.send(`return \n`);

  networkEnabled = true;
});

/****************************/
/* COPY TO CLIPBOARD BUTTON */
/****************************/

function copyToClipboard(elementId) {
  const copyText = document.getElementById(elementId);

  navigator.clipboard.writeText(copyText.textContent).then(function() {
    document.getElementById("copy-link-btn").classList.add("selected");
    document.getElementById("copy-link-btn").textContent = "Copied!";

    setTimeout(() => {
      document.getElementById("copy-link-btn").classList.remove("selected");
      document.getElementById("copy-link-btn").textContent = "Copy Link";
    }, 2500);
  })

}
