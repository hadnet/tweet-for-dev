import { nonNullable } from '../../utils';
import { Actions, type Action } from '../../types';

let isDark: boolean;

function setCSSTheme(isDark: boolean, tabId: number | undefined) {
  nonNullable(tabId);
  if (isDark) {
    chrome.scripting.insertCSS(
      {
        files: ['a11y-dark.css'],
        target: {
          tabId,
        },
      },
      () => {
        console.log('Dark CSS inserted');
      }
    );
    chrome.scripting.removeCSS({
      files: ['a11y-light.css'],
      target: {
        tabId,
      },
    });
  } else {
    chrome.scripting.insertCSS(
      {
        files: ['a11y-light.css'],
        target: {
          tabId,
        },
      },
      () => {
        console.log('Light CSS inserted');
      }
    );
    chrome.scripting.removeCSS({
      files: ['a11y-dark.css'],
      target: {
        tabId,
      },
    });
  }
}

chrome.runtime.onMessage.addListener((message: Action, sender) => {
  switch (message.action) {
    case Actions.fetchOpenAi: {
      //INFO: cant use async/await here because onMessage doesnt work properly with `await`
      fetch('https://openai-api.hadnet.workers.dev/?action=explain-code', {
        method: 'POST',
        body: JSON.stringify({ code: message.payload?.code }),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
        .then((response) => {
          let content = '';

          if (!response.ok) {
            throw new Error(response.statusText);
          }

          // This data is a ReadableStream
          const data = response.body;
          if (!data) {
            return;
          }

          (async () => {
            const reader = data.getReader();
            const _decoder = new TextDecoder();
            let done = false;

            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              const chunkValue = _decoder.decode(value);
              content += chunkValue;
              chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                  if (!tabs[0].id) return;
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: Actions.stream,
                    payload: content,
                  });
                }
              );
            }
          })();
        })
        .catch((e) => {
          if (e instanceof Error)
            throw new Error(`Error in fetching API: ${e.message}`);
        });
      break;
    }
    case Actions.copyToClipboard:
      chrome.notifications.create(
        {
          type: 'basic',
          title: 'Copied!',
          message: 'The code snippet was copied to your clipboard',
          iconUrl: 'icon-128.png',
        },
        () => console.log('A notification was created')
      );
      break;
    default:
      if (sender.url?.includes('https://twitter.com')) {
        isDark = message.payload?.isDark;
        setCSSTheme(isDark, sender.tab?.id);
      }
  }
  return true;
});
