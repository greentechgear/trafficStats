function getCleanDomain(domain) {
    return domain.replace(/^www\./, '');
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'fetchTrafficScore') {
      const currentDomain = getCleanDomain(new URL(location.href).hostname);
      console.log(`Current domain: ${currentDomain}`);
  
      const port = chrome.runtime.connect({ name: 'trafficScoreChannel' });
      port.postMessage({ command: 'fetchTrafficScore', currentDomain });
  
      port.onMessage.addListener(response => {
        if (response.command === 'updateBadge') {
          const score = response.score;
          console.log(`Score for current domain: ${score}`);
          if (score !== 'N/A') {
            chrome.runtime.sendMessage({ command: 'updateBadge', score }, response => {
              if (chrome.runtime.lastError) {
                console.error('Error updating badge:', chrome.runtime.lastError);
              } else {
                console.log('Badge updated successfully.');
              }
            });
          } else {
            console.warn('No score found for the current domain');
          }
        }
      });
    }
  });
  