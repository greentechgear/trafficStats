let trafficStats = {};

function fetchData() {
  fetch(chrome.runtime.getURL('trafficStats.json'))
    .then(response => {
      if (!response.ok) {
        console.error('Error fetching trafficStats.json:', response.status, response.statusText);
      }
      return response.json();
    })
    .then(data => {
      trafficStats = data.reduce((acc, item) => {
        acc[item.COLUMN2] = item.COLUMN1;
        return acc;
      }, {});
      console.log('trafficStats:', trafficStats);
    })
    .catch(error => console.error('Error processing trafficStats.json:', error));
}

chrome.runtime.onInstalled.addListener(fetchData);
chrome.runtime.onStartup.addListener(fetchData);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { command: 'fetchTrafficScore' });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'updateBadge') {
    const { score } = request;
    chrome.browserAction.setBadgeText({ text: score.toString(), tabId: sender.tab.id });
    chrome.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });
    console.log(`Badge updated for domain: ${sender.url}, Score: ${score}`);
  }
});

chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === 'trafficScoreChannel');

  port.onMessage.addListener(request => {
    if (request.command === 'fetchTrafficScore') {
      const currentDomain = request.currentDomain;
      const score = trafficStats[currentDomain] || 'N/A';
      port.postMessage({ command: 'updateBadge', score });
    }
  });
});
